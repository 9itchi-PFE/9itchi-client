'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { resumeKeys } from '@/hooks/useResumes'
import { usePlans } from '@/hooks/usePlans'
import { cn } from '@/lib/cn'
import { errorStatus } from '@/services/ApiService'
import ResumeService from '@/services/ResumeService'
import type { Resume } from '@/types/resume'
import { saveBlob } from '@/utils/saveBlob'
import { fileBase } from './fileBase'

export type DownloadMode = 'free' | 'pay' | 'sub' | ''

// DownloadDialogs are the three download dialogs of screen 4.1: first free PDF, free one used, subscriber.
export default function DownloadDialogs({
    mode,
    setMode,
    resume,
    templateName,
}: {
    mode: DownloadMode
    setMode: (m: DownloadMode) => void
    resume: Resume
    templateName: string
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

    const download = async (fmt: 'pdf' | 'docx', branded: boolean) => {
        setBusy(true)
        try {
            const { data: file } = await ResumeService.exportResume(resume.id, fmt)
            const { data: blob } = await ResumeService.downloadFile(resume.id, file.id)
            saveBlob(blob, file.filename)
            toast(t(branded ? 'toastFree' : 'toastSub', { file: file.filename, template: templateName }))
            close()
        } catch (err) {
            if (errorStatus(err) === 402) setMode('pay')
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
            <Modal open={mode === 'free'} onClose={close} eyebrow={t('freeEyebrow')} title={t('freeTitle')}>
                <div className="flex items-center gap-3.5 rounded-[14px] border border-line-soft p-3.5">
                    <div
                        aria-hidden
                        className="relative box-border flex h-24 w-[70px] flex-none flex-col gap-1 rounded border border-line-strong bg-white px-[7px] py-2"
                    >
                        <span className="h-[5px] w-3/5 rounded-sm bg-ink" />
                        {[80, 70, 85, 60].map((w) => (
                            <span key={w} className="h-[3px] bg-line-strong" style={{ width: `${w}%` }} />
                        ))}
                        <span className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-[3px] text-[6px] text-ink-3">
                            <span className="h-2 w-2 rounded-sm bg-lime" />
                            9itchi
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm leading-normal">
                        <strong>{t('freeWhat', { name: templateName })}</strong>
                        <span className="text-ink-3">{t('freeMark')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-fill-3 px-3.5 py-2.5 text-[13.5px] text-ink-3">
                    <span className="inline-flex h-[22px] items-center rounded-md bg-line px-[7px] text-[11.5px] font-bold text-ink-2">DOCX</span>
                    {t('freeWord')}
                </div>
                <Button size="lg" disabled={busy} onClick={() => download('pdf', true)}>
                    <Icon name="download" />
                    {t('freeButton')}
                </Button>
                <p className="m-0 text-center text-[13px] text-ink-3">{t('freeNote')}</p>
            </Modal>

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
                <Button size="lg" disabled={busy} onClick={() => download(format, false)}>
                    {t('subButton', { file: `${base}.${format}` })}
                </Button>
                <span className="text-center text-[13px] text-ink-3">{t('subNote')}</span>
            </Modal>
        </>
    )
}
