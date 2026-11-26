'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { Select } from '@/components/ui/Select'
import { useDraft, useGmailStatus, useRevokeGmail } from '@/hooks/useApplications'
import { useEmails } from '@/hooks/useEmails'
import { useResumes } from '@/hooks/useResumes'
import EmailService from '@/services/EmailService'
import JobService from '@/services/JobService'
import type { JobSummary } from '@/types/job'
import type { LetterLanguage } from '@/types/application'

type Letter = { subject: string; body: string; to: string }

const field = 'h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-sm outline-none focus:border-ink'

// OutreachScreen lets a student find recruiters for a company or role, have the AI write the email and send it from their own Gmail.
export default function OutreachScreen() {
    const t = useTranslations('outreach')
    const toast = useToast()
    const qc = useQueryClient()
    const gmail = useGmailStatus()
    const revoke = useRevokeGmail()
    const resumes = useResumes()
    const emails = useEmails()
    const draft = useDraft()
    const [query, setQuery] = useState('')
    const [found, setFound] = useState<JobSummary[] | null>(null)
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

    const search = useMutation({
        mutationFn: async () => (await JobService.listJobs({ q: query.trim(), page_size: 8 })).data.items,
        onSuccess: setFound,
    })

    const write = async (job: JobSummary) => {
        setOpen(job.id)
        if (letters[job.id]) return
        try {
            const d = await draft.mutateAsync({ job_id: job.id, resume_id: resume || undefined, language, tone: 'formal' })
            setLetters((l) => ({ ...l, [job.id]: { subject: d.subject, body: goal ? `${d.body}\n\n${goal}` : d.body, to: '' } }))
        } catch {
            toast(t('failed'))
        }
    }

    const edit = (id: string, patch: Partial<Letter>) => setLetters((l) => ({ ...l, [id]: { ...l[id], ...patch } }))

    const send = async (job: JobSummary) => {
        const l = letters[job.id]
        if (!connected) return toast(t('needGmail'))
        if (!resume) return toast(t('needResume'))
        setBusy(true)
        try {
            await EmailService.sendEmail({ job_id: job.id, resume_id: resume, to: l.to.trim(), subject: l.subject.trim(), body: l.body })
            setSentIds((s) => ({ ...s, [job.id]: true }))
            toast(t('sentToast', { email: l.to.trim() }))
            qc.invalidateQueries({ queryKey: ['emails'] })
        } catch {
            toast(t('failed'))
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
                    <Select className={field} value={resume} onChange={(e) => setResumeId(e.target.value)}>
                        {items.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.title}
                            </option>
                        ))}
                    </Select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                    {t('language')}
                    <Select className={field} value={language} onChange={(e) => setLanguage(e.target.value as LetterLanguage)}>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                    </Select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                    {t('goal')}
                    <input className={field} value={goal} onChange={(e) => setGoal(e.target.value)} />
                </label>
                <form
                    className="flex gap-2 md:col-span-3"
                    onSubmit={(e) => {
                        e.preventDefault()
                        search.mutate()
                    }}
                >
                    <input className={field} placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
                    <Button type="submit" className="flex-none" disabled={search.isPending}>
                        {search.isPending ? t('searching') : t('find')}
                    </Button>
                </form>
            </section>

            {found && found.length === 0 && <p className="m-0 text-sm text-ink-3">{t('noResults')}</p>}

            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {(found ?? []).map((job) => {
                    const l = letters[job.id]
                    const done = sentIds[job.id]
                    return (
                        <li key={job.id} className="flex flex-col gap-3 rounded-[16px] border border-line-soft bg-white p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <strong className="truncate text-base">{job.company}</strong>
                                    <span className="truncate text-sm text-ink-3">{job.title}</span>
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
                                    <input
                                        className={field}
                                        type="email"
                                        placeholder={t('recruiterEmail')}
                                        value={l.to}
                                        onChange={(e) => edit(job.id, { to: e.target.value })}
                                    />
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
                                    <Button className="self-end" disabled={busy || !l.to || !l.subject || !l.body} onClick={() => send(job)}>
                                        {busy ? t('sending') : t('send')}
                                    </Button>
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>

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
