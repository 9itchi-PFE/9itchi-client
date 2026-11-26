'use client'

import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useLocale, useTranslations } from 'next-intl'
import { Sk } from '@/components/jobs/OfferStates'
import { Button, ButtonLink } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useFollowUp, useFollowUpDraft } from '@/hooks/useApplications'
import { cn } from '@/lib/cn'
import type { Application, LetterLanguage } from '@/types/application'
import { quotaReason } from '@/utils/quota'
import { applyError } from './apply'

// FollowUpModal is the follow-up (« relance ») of an application a week without an answer: the AI writes it, the
// student reads and changes it, then it leaves from their Gmail to the recipient of the first email. An application
// the student sent themselves gets the text to copy.
export function FollowUpModal({ a, onClose }: { a: Application; onClose: () => void }) {
    const t = useTranslations('applications')
    const tc = useTranslations('common')
    const locale = useLocale()
    const toast = useToast()
    const draft = useFollowUpDraft(a.id)
    const send = useFollowUp(a.id)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [plan, setPlan] = useState(false)
    const asked = useRef(false)
    const language: LetterLanguage = locale === 'en' || locale === 'ar' ? locale : 'fr'
    const byGmail = a.via === 'gmail' && !!a.email

    const write = (fresh: boolean) =>
        draft.mutate(
            { language, fresh },
            {
                onSuccess: (d) => {
                    setSubject(d.subject)
                    setBody(d.body)
                },
            },
        )
    useEffect(() => {
        if (asked.current) return
        asked.current = true
        write(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const submit = () =>
        send.mutate(
            { subject: subject.trim(), body },
            {
                onSuccess: () => {
                    toast(t('followUpSent', { company: a.company }))
                    onClose()
                },
                onError: (e) => {
                    const status = isAxiosError(e) ? e.response?.status : undefined
                    const message = isAxiosError(e) ? String((e.response?.data as { error?: string } | undefined)?.error ?? '') : ''
                    if (status === 402) return setPlan(true)
                    const kind = applyError(status, message)
                    toast(kind === 'gmail' ? t('followUpGmail') : kind === 'already' ? t('followUpAlready') : tc('error'))
                },
            },
        )

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(`${subject.trim()}\n\n${body}`)
            toast(t('followUpCopied'))
        } catch {
            toast(tc('error'))
        }
    }

    const why = draft.isError ? quotaReason(draft.error) : null
    const planNeeded = plan || why === 'plan'

    return (
        <Modal open onClose={onClose} title={t('followUpTitle', { company: a.company })} width={640}>
            {planNeeded || why === 'used' ? (
                <div className="flex flex-col gap-3">
                    <strong className="text-[15px]">{why === 'used' ? t('followUpUsedTitle') : t('followUpPlanTitle')}</strong>
                    <p className="m-0 text-[14.5px] leading-[1.6] text-ink-3">{why === 'used' ? t('followUpUsedText') : t('followUpPlanText')}</p>
                    <ButtonLink href="/settings/billing" className="self-start">
                        {t('followUpPlanSee')}
                    </ButtonLink>
                </div>
            ) : draft.isError ? (
                <div className="flex flex-col items-start gap-3">
                    <p role="alert" className="m-0 text-[14.5px] text-[#B42318]">
                        {t('followUpError')}
                    </p>
                    <Button variant="secondary" onClick={() => write(false)}>
                        {tc('retry')}
                    </Button>
                </div>
            ) : draft.isPending && !body ? (
                <div aria-busy="true" className="flex flex-col gap-3">
                    <span className="text-sm text-ink-3">{t('followUpWriting')}</span>
                    <Sk className="h-10 w-full rounded-xl" />
                    <Sk className="h-40 w-full rounded-xl" />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {byGmail ? (
                        <span className="text-[13.5px] text-ink-3" dir="auto">
                            {t('followUpTo', { to: a.email!.recipient })}
                        </span>
                    ) : (
                        <p className="m-0 rounded-xl bg-fill px-3.5 py-2.5 text-[13.5px] leading-[1.55] text-ink-2">{t('followUpSelf')}</p>
                    )}
                    <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                        {t('followUpSubject')}
                        <input className={inputClass} dir="auto" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                        {t('followUpBody')}
                        <textarea
                            dir="auto"
                            value={body}
                            maxLength={10000}
                            onChange={(e) => setBody(e.target.value)}
                            className={cn(inputClass, 'min-h-[200px] py-3 leading-[1.6]', draft.isPending && 'opacity-50')}
                        />
                    </label>
                    <span className="text-[12.5px] text-ink-3">{t('followUpHint')}</span>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button variant="link" className="hit text-sm" disabled={draft.isPending || send.isPending} onClick={() => write(true)}>
                            {draft.isPending ? t('followUpWritingShort') : t('followUpRewrite')}
                        </Button>
                        {byGmail ? (
                            <Button disabled={send.isPending || !subject.trim() || !body.trim()} onClick={submit}>
                                {send.isPending ? t('followUpSending') : t('followUpSend')}
                            </Button>
                        ) : (
                            <Button disabled={!body.trim()} onClick={copy}>
                                {t('followUpCopy')}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    )
}
