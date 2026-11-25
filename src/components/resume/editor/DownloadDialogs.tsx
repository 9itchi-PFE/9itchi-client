'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { resumeKeys } from '@/hooks/useResumes'
import { usePlans } from '@/hooks/usePlans'
import { cn } from '@/lib/cn'
import { errorStatus } from '@/services/ApiService'
import ResumeService from '@/services/ResumeService'
import type { Downloads, Resume } from '@/types/resume'
import { saveBlob } from '@/utils/saveBlob'
import { fileBase } from './fileBase'

export type DownloadMode = 'pay' | 'limit' | 'sub' | ''

// downloadMode picks the dialog: without a subscription the CV cannot be downloaded; with one, the plan may limit
// the downloads of a period.
export function downloadMode(subscriber: boolean, downloads: Downloads | undefined): DownloadMode {
    if (!subscriber) return 'pay'
    const limit = downloads?.limit
    if (limit !== null && limit !== undefined && (downloads?.used ?? 0) >= limit) return 'limit'
    return 'sub'
}

// downloadsLeft is how many downloads the period still allows, null when the plan sets no limit.
export function downloadsLeft(downloads: Downloads | undefined): number | null {
    const limit = downloads?.limit
    if (limit === null || limit === undefined) return null
    return Math.max(0, limit - (downloads?.used ?? 0))
}

// DownloadDialogs are the download dialogs of screen 4.1: no subscription, the period's downloads used, subscriber.
export default function DownloadDialogs({
    mode,
    setMode,
    resume,
    templateName,
    subscriber,
    downloads,
}: {
    mode: DownloadMode
    setMode: (m: DownloadMode) => void
    resume: Resume
    templateName: string
    subscriber: boolean
    downloads: Downloads | undefined
}) {
    const t = useTranslations('download')
    const tc = useTranslations('common')
    const locale = useLocale()
    const toast = useToast()
    const qc = useQueryClient()
    const plans = usePlans().data?.items
    const [format, setFormat] = useState<'pdf' | 'docx'>('pdf')
    const [busy, setBusy] = useState(false)
    const close = () => setMode('')
    const base = fileBase(resume.content.contact.name, resume.title)
    const paid = plans?.filter((p) => p.active && p.price > 0).sort((a, b) => a.price - b.price)[0]

    const left = downloadsLeft(downloads)

    const download = async (fmt: 'pdf' | 'docx') => {
        setBusy(true)
        try {
            const { data: file } = await ResumeService.exportResume(resume.id, fmt)
            const { data: blob } = await ResumeService.downloadFile(resume.id, file.id)
            saveBlob(blob, file.filename)
            toast(t('toastSub', { file: file.filename, template: templateName }))
            close()
        } catch (err) {
            if (errorStatus(err) === 402) setMode(subscriber ? 'limit' : 'pay')
            else toast(tc('error'))
        } finally {
            setBusy(false)
            qc.invalidateQueries({ queryKey: resumeKeys.downloads })
        }
    }

    const original = async () => {
        const files = (await ResumeService.listFiles(resume.id)).data.items
        const f = files.find((x) => x.kind === 'original')
        if (!f) return toast(t('noOriginal'))
        const { data } = await ResumeService.downloadFile(resume.id, f.id)
        saveBlob(data, f.filename)
        toast(t('toastOriginal', { file: f.filename }))
        close()
    }

    const price = paid ? new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(paid.price) : null
    const language = t(`languages.${resume.language ?? 'fr'}`)

    return (
        <>
            <Modal open={mode === 'pay'} onClose={close} title={t('payTitle')}>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-3">{t('payText')}</p>
                {price ? (
                    <div className="flex items-baseline gap-2.5">
                        <span className="font-display text-[34px] font-extrabold">{t('payPrice', { price })}</span>
                        <span className="text-sm text-ink-3">{t('payPer')}</span>
                    </div>
                ) : null}
                <ButtonLink href="/settings/billing" size="lg">
                    {t('payButton')}
                </ButtonLink>
                <button
                    type="button"
                    onClick={original}
                    className="cursor-pointer self-center border-0 bg-transparent p-0 text-sm font-semibold text-violet hover:text-violet-hover"
                >
                    {t('payOriginal')}
                </button>
            </Modal>

            <Modal open={mode === 'limit'} onClose={close} title={t('limitTitle', { count: downloads?.limit ?? 0 })}>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-3">{t('limitText')}</p>
                <ButtonLink href="/settings/billing" size="lg">
                    {t('limitButton')}
                </ButtonLink>
                <button
                    type="button"
                    onClick={original}
                    className="cursor-pointer self-center border-0 bg-transparent p-0 text-sm font-semibold text-violet hover:text-violet-hover"
                >
                    {t('payOriginal')}
                </button>
            </Modal>

            <Modal open={mode === 'sub'} onClose={close} title={t('subTitle')} width={500}>
                <div role="radiogroup" aria-label={t('format')} className="flex flex-col gap-2">
                    {(
                        [
                            ['pdf', t('pdfName'), t('pdfDesc'), '#FEE4E2', '#B42318'],
                            ['docx', t('docxName'), t('docxDesc'), '#DCE8FF', '#1849A9'],
                        ] as const
                    ).map(([f, name, desc, bg, fg]) => (
                        <button
                            key={f}
                            type="button"
                            role="radio"
                            aria-checked={format === f}
                            onClick={() => setFormat(f)}
                            className={cn(
                                'flex cursor-pointer items-center gap-3.5 rounded-[14px] bg-white px-3.5 py-3 text-start',
                                format === f ? 'border-[1.5px] border-ink' : 'border border-line-strong',
                            )}
                        >
                            <span
                                className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[10px] text-[11.5px] font-extrabold"
                                style={{ background: bg, color: fg }}
                            >
                                {f.toUpperCase()}
                            </span>
                            <span className="flex flex-col gap-0.5">
                                <strong className="text-[15px]">{name}</strong>
                                <span className="text-[13px] text-ink-3">{desc}</span>
                            </span>
                        </button>
                    ))}
                </div>
                {format === 'docx' ? (
                    <span className="rounded-[10px] bg-[#FFF6ED] px-3 py-2.5 text-[13.5px] leading-normal text-[#9A3412]">{t('docxWarn')}</span>
                ) : null}
                <div className="flex items-center justify-between rounded-xl border border-line-soft px-3.5 py-3 text-sm text-ink-2">
                    <span>{t.rich('summary', { b: (c) => <strong>{c}</strong>, template: templateName, version: resume.title, language })}</span>
                    <Link href={`/resumes/templates?cv=${resume.id}`} className="font-semibold no-underline">
                        {t('change')}
                    </Link>
                </div>
                <Button size="lg" disabled={busy} onClick={() => download(format)}>
                    {t('subButton', { file: `${base}.${format}` })}
                </Button>
                <span className="text-center text-[13px] text-ink-3">
                    {left === null ? t('subNote') : t('subNoteLeft', { left, limit: downloads?.limit ?? 0 })}
                </span>
            </Modal>
        </>
    )
}
