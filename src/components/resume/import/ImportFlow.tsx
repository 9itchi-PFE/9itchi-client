'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { LogoReading } from '@/components/ui/Logo'
import { useMySubscription } from '@/hooks/usePlans'
import { useResume, useResumes, useResumeSlots, resumeKeys } from '@/hooks/useResumes'
import { cn } from '@/lib/cn'
import ResumeService from '@/services/ResumeService'
import { errorStatus } from '@/services/ApiService'
import { uploadFailure } from '@/utils/resumeSlots'
import ImportError from './ImportError'
import ImportResult from './ImportResult'

export const MAX_UPLOAD = 10 * 1024 * 1024
const ACCEPT = '.pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png'

type Failure = { file: string; reason: 'read' | 'size' | 'type' | 'quota' | 'full' | 'plan' | 'other' }

// ImportFlow drives choose -> reading -> done (or the error card). The resume id lives in ?cv= so a reload
// keeps waiting for the same reading. mode 'add' is a student who already has a CV (no stepper, no result card:
// the new CV opens in the editor once read).
export default function ImportFlow({ mode = 'onboarding' }: { mode?: 'onboarding' | 'add' }) {
    const add = mode === 'add'
    const base = add ? '/resumes/import' : '/resumes/upload'
    const t = useTranslations('import')
    const router = useRouter()
    const params = useSearchParams()
    const qc = useQueryClient()
    const [id, setId] = useState(params.get('cv') ?? '')
    const [fileName, setFileName] = useState(params.get('file') ?? '')
    const [uploading, setUploading] = useState(false)
    const [failure, setFailure] = useState<Failure | null>(null)
    const resume = useResume(id)
    const status = resume.data?.parse_status
    const list = useResumes().data
    const sub = useMySubscription().data
    const slots = useResumeSlots()

    const setUrl = useCallback(
        (cv: string, file: string) => {
            const q = cv ? `?cv=${encodeURIComponent(cv)}&file=${encodeURIComponent(file)}` : ''
            router.replace(`${base}${q}`)
        },
        [router, base],
    )

    useEffect(() => {
        if (status === 'failed') setFailure({ file: fileName, reason: 'read' })
    }, [status, fileName])

    useEffect(() => {
        if (!add || !id || (status !== 'done' && status !== 'none')) return
        qc.invalidateQueries({ queryKey: resumeKeys.list })
        router.replace(`/resumes/${id}`)
    }, [add, id, status, qc, router])

    const upload = async (file: File) => {
        setFailure(null)
        if (file.size > MAX_UPLOAD) return setFailure({ file: file.name, reason: 'size' })
        if (!/\.(pdf|docx|jpe?g|png)$/i.test(file.name)) return setFailure({ file: file.name, reason: 'type' })
        setUploading(true)
        try {
            const { data } = await ResumeService.uploadResume(file)
            qc.setQueryData(resumeKeys.one(data.resume.id), data.resume)
            qc.invalidateQueries({ queryKey: resumeKeys.list })
            setId(data.resume.id)
            setFileName(file.name)
            setUrl(data.resume.id, file.name)
        } catch (err) {
            const s = errorStatus(err)
            setFailure({ file: file.name, reason: uploadFailure(s, !!sub?.is_free) })
        } finally {
            setUploading(false)
        }
    }

    // reset forgets the current file. A half-read or failed CV is deleted; a read one only when it is the student's
    // only CV (the free plan's single slot stays available). With other CVs, a finished import is never deleted.
    const reset = async () => {
        const finished = status === 'done' || status === 'none'
        const alone = !!list && !list.items.some((r) => r.id !== id)
        if (id && (alone || !finished)) await ResumeService.deleteResume(id).catch(() => undefined)
        qc.invalidateQueries({ queryKey: resumeKeys.list })
        setId('')
        setFileName('')
        setFailure(null)
        setUrl('', '')
    }

    // Writing a CV in 9itchi is part of the subscription: without one, the blank CV leads to it.
    const canWrite = !sub?.is_free
    const blank = async () => {
        if (!canWrite) return router.push('/settings/billing')
        try {
            const { data } = await ResumeService.createResume({ title: t('blankTitleDefault') })
            qc.invalidateQueries({ queryKey: resumeKeys.list })
            router.push(`/resumes/${data.id}`)
        } catch (err) {
            setFailure({ file: '', reason: errorStatus(err) === 402 ? (sub?.is_free ? 'plan' : 'full') : 'other' })
        }
    }

    let body
    if (failure && (failure.reason === 'read' || failure.reason === 'size')) {
        body = <ImportError fileName={failure.file} onRetry={reset} onBlank={canWrite ? blank : undefined} />
    } else if (id && (uploading || !resume.data || status === 'pending' || (add && status !== 'failed'))) {
        body = <Reading fileName={fileName} onCancel={reset} />
    } else if (id && resume.data && (status === 'done' || status === 'none')) {
        body = <ImportResult resume={resume.data} fileName={fileName} onOther={reset} />
    } else {
        body = (
            <Choose
                onFile={upload}
                onBlank={blank}
                canWrite={canWrite}
                busy={uploading}
                add={add}
                billing={failure?.reason === 'quota' || failure?.reason === 'full' || failure?.reason === 'plan'}
                message={
                    failure
                        ? failure.reason === 'full'
                            ? t('errFull', { limit: slots.limit ?? slots.used })
                            : t(
                                  failure.reason === 'type'
                                      ? 'errType'
                                      : failure.reason === 'quota'
                                        ? 'errQuota'
                                        : failure.reason === 'plan'
                                          ? 'errPlan'
                                          : 'errFile',
                              )
                        : ''
                }
            />
        )
    }
    const Root = add ? 'div' : 'main'
    return <Root className="mx-auto box-border flex w-full max-w-[1000px] flex-col gap-7 px-4 sm:px-8 pb-16 pt-12">{body}</Root>
}

function Choose({
    onFile,
    onBlank,
    canWrite = true,
    busy,
    message,
    add = false,
    billing = false,
}: {
    onFile: (f: File) => void
    onBlank: () => void
    canWrite?: boolean
    busy: boolean
    message: string
    add?: boolean
    billing?: boolean
}) {
    const t = useTranslations('import')
    const tc = useTranslations('common')
    const input = useRef<HTMLInputElement>(null)
    const [over, setOver] = useState(false)
    return (
        <div className="flex flex-col gap-7">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{add ? t('addTitle') : t('title')}</h1>
                <p className="m-0 max-w-[560px] text-base leading-[1.6] text-ink-3">{add ? t('addLead') : t('lead')}</p>
            </div>
            <button
                type="button"
                disabled={busy}
                onClick={() => input.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault()
                    setOver(true)
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setOver(false)
                    const f = e.dataTransfer.files?.[0]
                    if (f) onFile(f)
                }}
                className={cn(
                    'flex cursor-pointer flex-col items-center gap-3.5 rounded-[22px] border-[1.5px] border-dashed bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-colors',
                    over ? 'border-violet bg-violet-tint' : 'border-[#B6BBC6]',
                )}
            >
                <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-lime text-ink">
                    <Icon name="upload" size={24} />
                </span>
                <span className="text-lg font-semibold">{over ? t('dropActive') : t('dropTitle')}</span>
                <span className="text-[15px] text-ink-3">
                    {t.rich('dropText', { browse: (chunks) => <span className="font-semibold text-violet">{chunks}</span> })}
                </span>
            </button>
            <input
                ref={input}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) onFile(f)
                }}
            />
            {message ? (
                <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-warn-bg px-4 py-3 text-center text-sm text-warn-fg">
                    <p className="m-0">{message}</p>
                    {billing ? (
                        <ButtonLink href="/settings/billing" size="sm">
                            {t('billingLink')}
                        </ButtonLink>
                    ) : null}
                </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={onBlank}
                    className="flex cursor-pointer items-start gap-3.5 rounded-[18px] border border-line-soft bg-white p-5 text-start text-ink hover:border-line-strong"
                >
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-fill">
                        <Icon name="pencil" />
                    </span>
                    <span className="flex flex-col gap-1">
                        <strong className="flex items-center gap-2 text-[15px]">
                            {t('blankTitle')}
                            {canWrite ? null : (
                                <span className="rounded-full bg-fill px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">{t('blankPlan')}</span>
                            )}
                        </strong>
                        <span className="text-sm leading-normal text-ink-3">{t('blankText')}</span>
                    </span>
                </button>
                <div aria-disabled="true" className="flex items-start gap-3.5 rounded-[18px] border border-line-soft bg-white p-5 text-ink opacity-80">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-fill">
                        <Icon name="link" />
                    </span>
                    <span className="flex flex-col gap-1">
                        <strong className="flex items-center gap-2 text-[15px]">
                            {t('linkedinTitle')}
                            <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[11.5px] font-semibold text-violet-hover">{tc('soon')}</span>
                        </strong>
                        <span className="text-sm leading-normal text-ink-3">{t('linkedinText')}</span>
                    </span>
                </div>
            </div>
            <p className="m-0 text-center text-[13px] text-ink-3">{t('privacy')}</p>
        </div>
    )
}

// readingSteps tick at these times (ms) while resume-api reads the file; the last one waits for parse_status, so the
// list keeps moving through a slow reading (often 20 to 40 s) instead of looking stuck.
const readingSteps = [
    { key: 'stepUpload', at: 500 },
    { key: 'stepText', at: 2000 },
    { key: 'stepContact', at: 5000 },
    { key: 'stepExperience', at: 10000 },
    { key: 'stepEducation', at: 16000 },
    { key: 'stepSkills', at: 23000 },
    { key: 'stepOrder', at: 30000 },
    { key: 'stepCheck', at: Infinity },
] as const
const slowAfter = 35000

// Reading shows the steps filling in while resume-api reads the file (polling parse_status).
function Reading({ fileName, onCancel }: { fileName: string; onCancel: () => void }) {
    const t = useTranslations('import')
    const tc = useTranslations('common')
    const [done, setDone] = useState(0)
    const [slow, setSlow] = useState(false)
    useEffect(() => {
        const timers = readingSteps.filter((s) => s.at !== Infinity).map((s, i) => setTimeout(() => setDone(i + 1), s.at))
        timers.push(setTimeout(() => setSlow(true), slowAfter))
        return () => timers.forEach(clearTimeout)
    }, [])
    const steps = readingSteps.map((s) => t(s.key))
    return (
        <div aria-live="polite" className="flex flex-col items-center gap-[22px] rounded-3xl border border-line-soft bg-white px-6 py-14 text-center">
            <LogoReading label={t('readingTitle')} />
            <div className="flex flex-col items-center gap-2">
                <h1 className="m-0 text-[32px] font-extrabold">{t('readingTitle')}</h1>
                <p className="m-0 max-w-[440px] text-[15px] leading-[1.6] text-ink-3">{t('readingText', { file: fileName || 'CV' })}</p>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-start text-sm">
                {steps.map((s, i) => (
                    <li key={s} className={cn('flex items-center gap-2.5', i >= done && 'text-ink-3')}>
                        {i < done ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-ink">
                                <Icon name="check" size={11} strokeWidth={3.5} />
                            </span>
                        ) : i === done ? (
                            <span className="box-border h-5 w-5 animate-spin rounded-full border-[1.5px] border-line-input border-t-ink motion-reduce:animate-none" />
                        ) : (
                            <span className="box-border h-5 w-5 rounded-full border-[1.5px] border-line-input" />
                        )}
                        {s}
                    </li>
                ))}
            </ul>
            {slow && <p className="m-0 max-w-[440px] text-[13px] leading-normal text-ink-3">{t('slowHint')}</p>}
            <Button variant="secondary" className="h-[38px] rounded-lg border-line-input px-3.5 font-medium" onClick={onCancel}>
                {tc('cancel')}
            </Button>
        </div>
    )
}
