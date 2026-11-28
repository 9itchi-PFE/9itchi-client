'use client'

import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { inputClass, TextArea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Select } from '@/components/ui/Select'
import { useAttachmentNames, useCancelEmail, useEmails, useUpdateEmail } from '@/hooks/useEmails'
import type { Email } from '@/types/application'
import type { Resume } from '@/types/resume'
import AttachmentFields from './AttachmentFields'
import { choiceOf, letterEdit, letterStem, sameName, type LetterChoice } from './attachments'
import { emailOk, fromTunisInput, scheduleOk, tunisInput } from './outreach'

const label = 'flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2'
const SENT_SHOWN = 10

// EditEmail changes a scheduled email before it leaves (PATCH /emails/:id).
function EditEmail({ email, resumes, onClose }: { email: Email; resumes: Pick<Resume, 'id' | 'title'>[]; onClose: () => void }) {
    const t = useTranslations('outreach.scheduled')
    const c = useTranslations('outreach.composer')
    const toast = useToast()
    const update = useUpdateEmail()
    const [to, setTo] = useState(email.recipient)
    const [subject, setSubject] = useState(email.subject)
    const [body, setBody] = useState(email.body)
    const [at, setAt] = useState(email.scheduled_at ? tunisInput(new Date(email.scheduled_at)) : '')
    const [attach, setAttach] = useState(!!email.resume_id)
    const [resumeId, setResumeId] = useState(email.resume_id ?? resumes[0]?.id ?? '')
    const [letter, setLetter] = useState<LetterChoice>(() => choiceOf(email))
    const names = useAttachmentNames(attach ? resumeId : '', email.letter_language ?? 'fr')
    const cvFilename = attach ? (names.data?.cv_filename ?? '') : ''
    const letterSame = letter.attach && sameName(letterStem(letter, names.data), cvFilename)
    const time = fromTunisInput(at)
    const ok = emailOk(to) && !!subject.trim() && !!body.trim() && scheduleOk(time) && (!attach || !!resumeId) && !letterSame

    const save = async () => {
        if (!ok || !time) return
        try {
            await update.mutateAsync({
                id: email.id,
                edit: {
                    to: to.trim(),
                    subject: subject.trim(),
                    body,
                    scheduled_at: time.toISOString(),
                    attach_cv: attach,
                    resume_id: attach ? resumeId : undefined,
                    ...letterEdit(letter, email),
                },
            })
            toast(t('saved'))
            onClose()
        } catch (e) {
            toast(isAxiosError(e) && e.response?.status === 409 ? t('gone') : t('saveFailed'))
        }
    }

    return (
        <Modal open onClose={onClose} title={t('editTitle')} width={560}>
            <div className="flex flex-col gap-3.5">
                <label className={label}>
                    {c('to')}
                    <input type="email" dir="ltr" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
                <label className={label}>
                    {c('subject')}
                    <input className={inputClass} dir="auto" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
                </label>
                <label className={label}>
                    {c('body')}
                    <TextArea className="min-h-[160px]" maxLength={10000} value={body} onChange={(e) => setBody(e.target.value)} />
                </label>
                <label className={label}>
                    {c('at')}
                    <input type="datetime-local" className={inputClass} aria-invalid={!scheduleOk(time)} value={at} onChange={(e) => setAt(e.target.value)} />
                    <span className="text-[12.5px] font-normal text-ink-3">{scheduleOk(time) ? c('atHint') : c('atInvalid')}</span>
                </label>
                <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                    <input type="checkbox" className="h-5 w-5 accent-ink" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
                    {c('attach')}
                </label>
                {attach && resumes.length ? (
                    <Select aria-label={c('attachResume')} className={inputClass} value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                        {resumes.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.title}
                            </option>
                        ))}
                    </Select>
                ) : null}
                <AttachmentFields cvFilename={cvFilename} names={names.data} value={letter} onChange={setLetter} />
                <div className="flex flex-wrap justify-end gap-2.5">
                    <Button variant="secondary" onClick={onClose}>
                        {t('close')}
                    </Button>
                    <Button disabled={!ok || update.isPending} onClick={save}>
                        {update.isPending ? t('saving') : t('save')}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

// ScheduledList is what left or will leave from the student's Gmail: scheduled emails can be changed or cancelled.
export default function ScheduledList({ resumes }: { resumes: Pick<Resume, 'id' | 'title'>[] }) {
    const t = useTranslations('outreach.scheduled')
    const format = useFormatter()
    const toast = useToast()
    const emails = useEmails()
    const cancel = useCancelEmail()
    const [editing, setEditing] = useState<Email | null>(null)
    const [cancelling, setCancelling] = useState<Email | null>(null)
    const all = Array.isArray(emails.data) ? emails.data : []
    const scheduled = all.filter((e) => e.status === 'scheduled').sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))
    const sent = all.filter((e) => e.status === 'sent').slice(0, SENT_SHOWN)
    const when = (iso: string | null) => (iso ? format.dateTime(new Date(iso), { dateStyle: 'medium', timeStyle: 'short' }) : '')

    if (emails.isLoading) return null
    if (emails.isError) {
        return (
            <p role="alert" className="m-0 rounded-[16px] border border-warn-line bg-warn-bg p-4 text-sm text-warn-fg">
                {t('error')}
            </p>
        )
    }

    return (
        <section aria-label={t('title')} className="flex flex-col gap-3 rounded-[20px] border border-line-soft bg-white p-4 sm:p-5">
            <h2 className="m-0 text-lg font-bold">{t('title')}</h2>
            {scheduled.length === 0 && sent.length === 0 ? <p className="m-0 text-sm text-ink-3">{t('empty')}</p> : null}
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {scheduled.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] bg-fill-3 p-3">
                        <Icon name="clock" className="flex-none text-violet" />
                        <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                            <span className="truncate text-sm font-semibold" dir="ltr">
                                {e.recipient}
                            </span>
                            <span className="truncate text-[13px] text-ink-3">{e.subject}</span>
                            <span className="text-[12.5px] text-violet">{t('leavesAt', { when: when(e.scheduled_at) })}</span>
                        </span>
                        <span className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setEditing(e)}>
                                <Icon name="pencil" size={14} /> {t('edit')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setCancelling(e)}>
                                {t('cancel')}
                            </Button>
                        </span>
                    </li>
                ))}
                {sent.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-3 py-1.5">
                        <Icon name="check" className="flex-none text-ok-fg" />
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium" dir="ltr">
                                {e.recipient}
                            </span>
                            <span className="truncate text-[13px] text-ink-3">{e.subject}</span>
                        </span>
                        {e.sent_at ? <span className="flex-none text-[12.5px] text-ink-3">{format.relativeTime(new Date(e.sent_at))}</span> : null}
                    </li>
                ))}
            </ul>
            {editing ? <EditEmail email={editing} resumes={resumes} onClose={() => setEditing(null)} /> : null}
            <ConfirmDialog
                open={!!cancelling}
                title={t('cancelTitle')}
                confirmLabel={t('cancelConfirm')}
                cancelLabel={t('keep')}
                busy={cancel.isPending}
                onClose={() => setCancelling(null)}
                onConfirm={async () => {
                    if (!cancelling) return
                    try {
                        await cancel.mutateAsync(cancelling.id)
                        toast(t('cancelled'))
                    } catch {
                        toast(t('cancelFailed'))
                    }
                    setCancelling(null)
                }}
            >
                {t('cancelText', { email: cancelling?.recipient ?? '' })}
            </ConfirmDialog>
        </section>
    )
}
