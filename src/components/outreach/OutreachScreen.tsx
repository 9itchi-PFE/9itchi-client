'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { applyError } from '@/components/applications/apply'
import { match } from '@/components/jobs/offer'
import { Icon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { useApply, useDraft, useGmailStatus, useRevokeGmail } from '@/hooks/useApplications'
import { useEmails } from '@/hooks/useEmails'
import { useCvSkills, useResumes } from '@/hooks/useResumes'
import { quotaReason } from '@/utils/quota'
import { isAxiosError } from 'axios'
import EmailService from '@/services/EmailService'
import JobService from '@/services/JobService'
import type { JobSummary } from '@/types/job'
import { outreachQuery } from './outreach'
import type { LetterLanguage } from '@/types/application'

type Letter = { subject: string; body: string; to: string }

const field = 'h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-sm outline-none focus:border-ink'

// OutreachScreen lists the offers that fit the chosen CV best, has the AI write the email around the student's goal, and sends it
// from their Gmail as an application, to the offer's own address when it has one.
export default function OutreachScreen() {
    const t = useTranslations('outreach')
    const ta = useTranslations('apply')
    const toast = useToast()
    const qc = useQueryClient()
    const gmail = useGmailStatus()
    const revoke = useRevokeGmail()
    const resumes = useResumes()
    const emails = useEmails()
    const draft = useDraft()
    const apply = useApply()
    const [query, setQuery] = useState('')
    const [q, setQ] = useState('')
    const [planOpen, setPlanOpen] = useState(false)
    const [resumeId, setResumeId] = useState('')
    const [language, setLanguage] = useState<LetterLanguage>('en')
    const [goal, setGoal] = useState(t('goalDefault'))
    const [open, setOpen] = useState<string | null>(null)
    const [letters, setLetters] = useState<Record<string, Letter>>({})
    const [sentIds, setSentIds] = useState<Record<string, true>>({})
    const [busy, setBusy] = useState(false)

    const connected = !!gmail.data?.connected
    const items = resumes.data?.items ?? []
    const resume = resumeId || items[0]?.id || ''
    const chosen = items.find((r) => r.id === resume)
    const cv = useCvSkills(resume)
    const results = useQuery({
        queryKey: ['jobs', 'outreach', resume, cv.skills, q],
        queryFn: async () => (await JobService.listJobs(outreachQuery(q, cv.skills))).data.items,
        enabled: resumes.isFetched && cv.ready,
    })
    const found: JobSummary[] | undefined = results.data

    const enable = async () => {
        setBusy(true)
        try {
            const { data } = await EmailService.connectGmail()
            sessionStorage.setItem('outreach_return', '1')
            window.location.assign(data.url)
        } catch {
            setBusy(false)
            toast(t('unavailable'))
        }
    }

    const write = async (job: JobSummary) => {
        setOpen(job.id)
        if (letters[job.id]) return
        try {
            const d = await draft.mutateAsync({ job_id: job.id, resume_id: resume || undefined, language, tone: 'formal', goal: goal.trim() || undefined })
            setLetters((l) => ({ ...l, [job.id]: { subject: d.subject, body: d.body, to: '' } }))
        } catch (e) {
            const why = quotaReason(e)
            setOpen(null)
            toast(why === 'used' ? ta('draftUsedTitle') : why === 'plan' ? ta('draftPlanTitle') : t('failed'))
        }
    }

    const edit = (id: string, patch: Partial<Letter>) => setLetters((l) => ({ ...l, [id]: { ...l[id], ...patch } }))

    const send = async (job: JobSummary) => {
        const l = letters[job.id]
        if (!connected) return toast(t('needGmail'))
        if (!resume) return toast(t('needResume'))
        setBusy(true)
        try {
            await apply.mutateAsync({
                job_id: job.id,
                resume_id: resume,
                via: 'gmail',
                to: job.easy_apply ? undefined : l.to.trim(),
                subject: l.subject.trim(),
                body: l.body,
            })
            setSentIds((s) => ({ ...s, [job.id]: true }))
            toast(job.easy_apply ? t('sentTo', { company: job.company }) : t('sentToast', { email: l.to.trim() }))
            qc.invalidateQueries({ queryKey: ['emails'] })
        } catch (e) {
            const kind = applyError(isAxiosError(e) ? e.response?.status : undefined, isAxiosError(e) ? String(e.response?.data?.error ?? '') : '')
            if (kind === 'plan') setPlanOpen(true)
            else if (kind === 'gmail') toast(t('needGmail'))
            else if (kind === 'noFile') toast(ta('noFile'))
            else if (kind === 'noEmail') toast(t('noEmail'))
            else if (kind === 'closed') toast(t('closed'))
            else if (kind === 'already') {
                setSentIds((s) => ({ ...s, [job.id]: true }))
                toast(t('already'))
            } else toast(t('failed'))
        } finally {
            setBusy(false)
        }
    }

    const sent = (emails.data ?? []).filter((e) => e.status === 'sent')

    return (
        <main className="mx-auto box-border flex w-full max-w-[1100px] flex-1 flex-col gap-5 px-4 sm:px-8 pb-16 pt-8">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[30px] sm:text-[40px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p className="m-0 text-base text-ink-3">{t('intro')}</p>
            </div>

            <section className="flex flex-wrap items-center gap-3.5 rounded-[20px] border border-line-soft bg-fill p-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white">
                    <Icon name="send" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="text-[15px]">{t('gmailTitle')}</strong>
                    <span className="text-[13.5px] text-ink-3">{connected ? t('connectedAs', { email: gmail.data?.email ?? '' }) : t('notConnected')}</span>
                    {!connected && <span className="text-[12.5px] text-ink-3">{t('consentNote')}</span>}
                </span>
                {connected ? (
                    <Button variant="secondary" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate()}>
                        {t('enabled')} · {t('disable')}
                    </Button>
                ) : (
                    <Button size="sm" disabled={busy || gmail.isLoading} onClick={enable}>
                        {t('enable')}
                    </Button>
                )}
            </section>

            <section className="grid gap-4 rounded-[20px] border border-line-soft bg-white p-6 md:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                    {t('resume')}
                    <select className={field} value={resume} onChange={(e) => setResumeId(e.target.value)}>
                        {items.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.title}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                    {t('language')}
                    <select className={field} value={language} onChange={(e) => setLanguage(e.target.value as LetterLanguage)}>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                    {t('goal')}
                    <input className={field} value={goal} maxLength={300} placeholder={t('goalHint')} onChange={(e) => setGoal(e.target.value)} />
                </label>
                <form
                    className="flex gap-2 md:col-span-3"
                    onSubmit={(e) => {
                        e.preventDefault()
                        setQ(query)
                    }}
                >
                    <input className={field} placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
                    <Button type="submit" className="flex-none" disabled={results.isFetching}>
                        {results.isFetching ? t('searching') : t('find')}
                    </Button>
                </form>
            </section>

            {chosen && cv.ready ? (
                <p className="m-0 text-sm text-ink-3">{cv.skills.length ? t('rankedBy', { title: chosen.title }) : t('rankedByDate')}</p>
            ) : null}
            {found && found.length === 0 && <p className="m-0 text-sm text-ink-3">{t('noResults')}</p>}

            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {(found ?? []).map((job) => {
                    const l = letters[job.id]
                    const done = sentIds[job.id]
                    const m = cv.skills.length ? match(job.skills, cv.skills) : null
                    return (
                        <li key={job.id} className="flex flex-col gap-3 rounded-[16px] border border-line-soft bg-white p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <strong className="truncate text-base">{job.company}</strong>
                                    <span className="truncate text-sm text-ink-3">{job.title}</span>
                                    {m && m.fits.length ? (
                                        <span className="mt-1 self-start whitespace-nowrap rounded-full bg-fill px-2.5 py-0.5 text-xs font-semibold text-ink-2">
                                            {t('fits', { count: m.fits.length, total: job.skills.length })}
                                        </span>
                                    ) : null}
                                </span>
                                {done ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F8A5F]">
                                        <Icon name="check" /> {t('sent')}
                                    </span>
                                ) : (
                                    <Button variant="secondary" size="sm" disabled={draft.isPending && open === job.id} onClick={() => write(job)}>
                                        {draft.isPending && open === job.id ? t('generating') : t('generate')}
                                    </Button>
                                )}
                            </div>
                            {l && !done && (
                                <div className="flex flex-col gap-2.5">
                                    {job.easy_apply ? (
                                        <div className="flex flex-col gap-0.5 rounded-xl border border-line-soft bg-fill px-3.5 py-2.5 text-sm">
                                            <span className="font-semibold">
                                                {t('recruiterEmail')} : {t('toRecruiter')}
                                            </span>
                                            <span className="text-[12.5px] text-ink-3">{t('toRecruiterHint')}</span>
                                        </div>
                                    ) : (
                                        <input
                                            className={field}
                                            type="email"
                                            dir="ltr"
                                            aria-label={t('recruiterEmail')}
                                            placeholder={t('recruiterEmail')}
                                            value={l.to}
                                            onChange={(e) => edit(job.id, { to: e.target.value })}
                                        />
                                    )}
                                    <input
                                        className={field}
                                        placeholder={t('subject')}
                                        value={l.subject}
                                        onChange={(e) => edit(job.id, { subject: e.target.value })}
                                    />
                                    <textarea
                                        className="min-h-[180px] w-full rounded-xl border border-line-strong bg-white p-3.5 text-sm outline-none focus:border-ink"
                                        placeholder={t('body')}
                                        value={l.body}
                                        onChange={(e) => edit(job.id, { body: e.target.value })}
                                    />
                                    <Button
                                        className="self-end"
                                        disabled={busy || (!job.easy_apply && !l.to.trim()) || !l.subject.trim() || !l.body.trim()}
                                        onClick={() => send(job)}
                                    >
                                        {busy ? t('sending') : t('send')}
                                    </Button>
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>

            <Modal open={planOpen} onClose={() => setPlanOpen(false)} eyebrow={ta('planEyebrow')} title={ta('planTitle')}>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-3">{ta('planText')}</p>
                <ButtonLink href="/settings/billing" size="lg" className="w-full">
                    {ta('planSee')}
                </ButtonLink>
            </Modal>

            {sent.length > 0 && (
                <section className="flex flex-col gap-2 rounded-[20px] border border-line-soft bg-white p-5">
                    <h2 className="m-0 text-lg font-bold">{t('sentList')}</h2>
                    <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
                        {sent.map((e) => (
                            <li key={e.id} className="flex items-center gap-2">
                                <Icon name="check" />
                                <span className="font-medium">{e.recipient}</span>
                                <span className="truncate text-ink-3">{e.subject}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </main>
    )
}
