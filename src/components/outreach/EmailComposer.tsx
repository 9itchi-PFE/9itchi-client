'use client'

import { useState, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/Button'
import { inputClass, TextArea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import { Select } from '@/components/ui/Select'
import { useGmailStatus } from '@/hooks/useApplications'
import { useAttachmentNames, useSendEmail } from '@/hooks/useEmails'
import { quotaReason } from '@/utils/quota'
import type { LetterLanguage, Tone } from '@/types/application'
import type { Resume } from '@/types/resume'
import AttachmentFields from './AttachmentFields'
import { attachmentError } from './attachments'
import Paywall from './Paywall'
import { emailOk, fromTunisInput, scheduleOk, tunisInput } from './outreach'

export type DraftAsk = { language: LetterLanguage; tone: Tone; fresh: boolean; resume_id?: string }
type Written = { subject: string; body: string }

const label = 'flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2'
const asLanguage = (l: string): LetterLanguage => (l === 'en' || l === 'ar' ? l : 'fr')

// EmailComposer is the email to one recipient, written by the AI then edited by the student, sent from their Gmail
// now or at a time (Tunis). Without the CV toggle no resume_id is sent: the email leaves without an attachment.
export default function EmailComposer({
    heading,
    to,
    onTo,
    toHint,
    initial,
    language: firstLanguage,
    tone: firstTone,
    resumes,
    resumeId: firstResume,
    jobId,
    draft,
    onSent,
}: {
    heading: ReactNode
    to: string
    onTo: (to: string) => void
    toHint?: string
    // initial is a letter already written (the link flow writes it before showing the composer).
    initial?: Written
    language?: LetterLanguage
    tone?: Tone
    resumes: Pick<Resume, 'id' | 'title'>[]
    resumeId: string
    jobId?: string
    draft: (ask: DraftAsk) => Promise<Written>
    onSent?: () => void
}) {
    const t = useTranslations('outreach.composer')
    const toast = useToast()
    const locale = useLocale()
    const gmail = useGmailStatus()
    const send = useSendEmail()
    const [subject, setSubject] = useState(initial?.subject ?? '')
    const [body, setBody] = useState(initial?.body ?? '')
    const [language, setLanguage] = useState<LetterLanguage>(firstLanguage ?? asLanguage(locale))
    const [tone, setTone] = useState<Tone>(firstTone ?? 'formal')
    const [attach, setAttach] = useState(!!firstResume)
    const [resumeId, setResumeId] = useState(firstResume || resumes[0]?.id || '')
    const [when, setWhen] = useState<'now' | 'later'>('now')
    const [at, setAt] = useState(() => tunisInput(new Date(Date.now() + 60 * 60_000)))
    const [writing, setWriting] = useState(false)
    const [blocked, setBlocked] = useState<{ what: 'draft' | 'send'; reason: 'plan' | 'used' } | null>(null)
    const [sent, setSent] = useState<'now' | 'later' | null>(null)
    const names = useAttachmentNames(attach ? resumeId : '', language)
    const cvFilename = attach ? (names.data?.cv_filename ?? '') : ''

    const written = !!(subject || body)
    const connected = !!gmail.data?.connected
    const time = when === 'later' ? fromTunisInput(at) : null
    const timeOk = when === 'now' || scheduleOk(time)
    const ready = connected && emailOk(to) && !!subject.trim() && !!body.trim() && timeOk && (!attach || !!resumeId)

    const write = async (fresh: boolean) => {
        setWriting(true)
        setBlocked(null)
        try {
            const d = await draft({ language, tone, fresh, resume_id: resumeId || undefined })
            setSubject(d.subject)
            setBody(d.body)
        } catch (e) {
            const reason = quotaReason(e)
            if (reason) setBlocked({ what: 'draft', reason })
            else toast(t('draftFailed'))
        } finally {
            setWriting(false)
        }
    }

    const submit = async () => {
        if (!ready) return
        setBlocked(null)
        try {
            await send.mutateAsync({
                job_id: jobId,
                resume_id: attach ? resumeId : undefined,
                to: to.trim(),
                subject: subject.trim(),
                body,
                scheduled_at: when === 'later' && time ? time.toISOString() : undefined,
                // Outreach emails carry no cover letter (email-api attaches one when attach_letter is absent).
                attach_letter: false,
                language,
            })
            setSent(when)
            toast(when === 'later' ? t('scheduledToast') : t('sentToast', { email: to.trim() }))
            onSent?.()
        } catch (e) {
            const reason = quotaReason(e)
            if (reason) return setBlocked({ what: 'send', reason })
            const status = isAxiosError(e) ? e.response?.status : undefined
            const attachment = attachmentError(status, isAxiosError(e) ? e.response?.data?.error : undefined)
            toast(attachment ? t(attachment) : status === 409 ? t('needGmail') : t('sendFailed'))
        }
    }

    if (sent) {
        return (
            <div className="flex flex-col items-start gap-3 rounded-[20px] border border-line-soft bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ok-bg text-ok-fg">
                    <Icon name="check" />
                </span>
                <strong className="text-base">{sent === 'later' ? t('scheduledTitle') : t('sentTitle')}</strong>
                <span className="break-all text-sm text-ink-3" dir="ltr">
                    {to}
                </span>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 rounded-[20px] border border-line-soft bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-0.5">{heading}</div>

            <label className={label}>
                {t('to')}
                <input type="email" dir="ltr" className={inputClass} value={to} onChange={(e) => onTo(e.target.value)} placeholder="nom@entreprise.tn" />
                {toHint ? <span className="text-[12.5px] font-normal text-ink-3">{toHint}</span> : null}
            </label>

            <div className="flex flex-wrap items-end gap-3">
                <label className={label}>
                    {t('language')}
                    <Select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value as LetterLanguage)}>
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                    </Select>
                </label>
                <div className={label}>
                    <span>{t('tone')}</span>
                    <Segmented
                        label={t('tone')}
                        role="radiogroup"
                        value={tone}
                        onChange={setTone}
                        options={[
                            { value: 'formal', label: t('formal') },
                            { value: 'friendly', label: t('friendly') },
                        ]}
                    />
                </div>
                <Button variant="secondary" disabled={writing} onClick={() => write(written)}>
                    <Icon name="pencil" /> {writing ? t('writing') : written ? t('rewrite') : t('write')}
                </Button>
            </div>

            {blocked?.what === 'draft' ? <Paywall what="draft" reason={blocked.reason} /> : null}

            <label className={label}>
                {t('subject')}
                <input className={inputClass} dir="auto" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className={label}>
                {t('body')}
                <TextArea
                    className="min-h-[220px]"
                    maxLength={10000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t('bodyPlaceholder')}
                />
            </label>

            <div className="flex flex-col gap-2 rounded-[14px] bg-fill-3 p-3">
                <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                    <input type="checkbox" className="h-5 w-5 accent-ink" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
                    {t('attach')}
                </label>
                {attach ? (
                    resumes.length ? (
                        <Select aria-label={t('attachResume')} className={inputClass} value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                            {resumes.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.title}
                                </option>
                            ))}
                        </Select>
                    ) : (
                        <span className="text-[12.5px] text-ink-3">{t('noResume')}</span>
                    )
                ) : null}
            </div>

            <AttachmentFields cvFilename={cvFilename} />

            <div className="flex flex-col gap-2">
                <Segmented
                    label={t('when')}
                    role="radiogroup"
                    value={when}
                    onChange={setWhen}
                    className="self-start"
                    options={[
                        { value: 'now', label: t('now') },
                        { value: 'later', label: t('later') },
                    ]}
                />
                {when === 'later' ? (
                    <label className={label}>
                        {t('at')}
                        <input
                            type="datetime-local"
                            className={inputClass}
                            aria-invalid={!timeOk}
                            min={tunisInput(new Date(Date.now() + 2 * 60_000))}
                            value={at}
                            onChange={(e) => setAt(e.target.value)}
                        />
                        <span className="text-[12.5px] font-normal text-ink-3">{timeOk ? t('atHint') : t('atInvalid')}</span>
                    </label>
                ) : null}
            </div>

            {blocked?.what === 'send' ? <Paywall what="send" reason={blocked.reason} /> : null}

            <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" className="flex-[1_1_200px] sm:flex-none" disabled={!ready || send.isPending} onClick={submit}>
                    <Icon name={when === 'later' ? 'clock' : 'send'} /> {send.isPending ? t('sending') : when === 'later' ? t('schedule') : t('send')}
                </Button>
                {!connected && !gmail.isLoading ? <span className="text-[12.5px] text-ink-3">{t('needGmail')}</span> : null}
            </div>
        </div>
    )
}
