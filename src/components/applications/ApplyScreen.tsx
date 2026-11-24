'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { useSessionContext } from '@/components/auth/AuthProvider'
import { CompanyBadge, DeadlineText } from '@/components/jobs/OfferCard'
import { Sk } from '@/components/jobs/OfferStates'
import { city, deadline, sourceName } from '@/components/jobs/offer'
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { LogoReading } from '@/components/ui/Logo'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import { useApplications, useApply, useDraft, useGmailStatus } from '@/hooks/useApplications'
import { useJob, useSimilarJobs } from '@/hooks/useJobs'
import { useMyCv, useResume } from '@/hooks/useResumes'
import { cn } from '@/lib/cn'
import EmailService from '@/services/EmailService'
import ResumeService from '@/services/ResumeService'
import type { Application, LetterLanguage, Tone } from '@/types/application'
import type { Job } from '@/types/job'
import { saveBlob } from '@/utils/saveBlob'
import { applyError, compose, followUpOn, live, localInput, ownIndex, paragraphs, savePending, sentence, slots, takePending, validTime } from './apply'

const eyebrow = 'font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3'
const dot = 'flex h-6 w-6 flex-none items-center justify-center rounded-full'

const errorOf = (e: unknown) => ({
    status: isAxiosError(e) ? e.response?.status : undefined,
    message: isAxiosError(e) ? ((e.response?.data as { error?: string } | undefined)?.error ?? '') : '',
})

// Steps is the « CV, Lettre, Envoi » trail at the top of the screen.
function Steps({ done }: { done: boolean }) {
    const t = useTranslations('apply')
    return (
        <ol aria-label={t('steps')} className="m-0 flex list-none items-center gap-2.5 p-0 text-sm">
            <li className="flex items-center gap-2 text-ink-3">
                <span className={cn(dot, 'bg-ink text-lime')}>
                    <Icon name="check" size={12} strokeWidth={3} />
                </span>
                {t('stepCv')}
            </li>
            <li aria-hidden className="h-[1.5px] w-7 bg-ink" />
            <li aria-current={done ? undefined : 'step'} className={cn('flex items-center gap-2', done ? 'text-ink-3' : 'font-semibold')}>
                <span className={cn(dot, 'bg-ink text-xs font-semibold', done ? 'text-lime' : 'text-white')}>
                    {done ? <Icon name="check" size={12} strokeWidth={3} /> : 2}
                </span>
                {t('stepLetter')}
            </li>
            <li aria-hidden className={cn('h-[1.5px] w-7', done ? 'bg-ink' : 'bg-line-strong')} />
            <li aria-current={done ? 'step' : undefined} className={cn('flex items-center gap-2', done ? 'font-semibold' : 'text-ink-3')}>
                <span className={cn(dot, 'text-xs', done ? 'bg-lime font-bold text-ink' : 'border-[1.5px] border-[#C9CDD5] text-ink-3')}>3</span>
                {t('stepSend')}
            </li>
        </ol>
    )
}

// Para is one paragraph of the letter, edited in place: it grows with its text.
function Para({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
        <div className="-mx-1.5 grid">
            <textarea
                aria-label={label}
                dir="auto"
                rows={1}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="col-start-1 row-start-1 resize-none overflow-hidden rounded-md border-0 bg-transparent px-1.5 py-0 text-inherit outline-none [font:inherit] [line-height:inherit] hover:bg-fill-3 focus:bg-violet-tint"
            />
            <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre-wrap break-words px-1.5">
                {value + ' '}
            </span>
        </div>
    )
}

function Shell({ id, done = false, children }: { id: string; done?: boolean; children: React.ReactNode }) {
    const t = useTranslations('apply')
    return (
        <main className="mx-auto box-border flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-8 pb-[72px] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Link
                    href={`/jobs?tab=all&job=${id}`}
                    className="inline-flex h-10 items-center gap-2 text-sm font-medium text-ink-2 no-underline hover:text-ink"
                >
                    <Icon name="left" size={16} className="rtl:rotate-180" />
                    {t('back')}
                </Link>
                <Steps done={done} />
            </div>
            {children}
        </main>
    )
}

// Notice is a centred card for the cases where there is no letter to show: no CV yet, already applied, offer gone.
function Notice({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
    return (
        <section className="mx-auto mt-6 box-border flex w-full max-w-[620px] flex-col items-center gap-3.5 rounded-3xl border-[1.5px] border-ink bg-white px-10 py-11 text-center shadow-pop">
            <h1 className="m-0 text-[30px] font-extrabold leading-[1.1]">{title}</h1>
            <p className="m-0 max-w-[460px] text-base leading-[1.6] text-ink-3">{text}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2.5">{children}</div>
        </section>
    )
}

// Writing is screen LoadLetter: the offer the student applies to, and the letter being written.
function Writing({ job }: { job: Job }) {
    const t = useTranslations('apply')
    const o = useTranslations('offers')
    return (
        <section aria-busy="true" className="mx-auto mt-4 flex w-full max-w-[620px] flex-col items-center gap-5 text-center">
            <div className="flex items-center gap-3 rounded-2xl border border-line-soft bg-white px-4 py-3 text-start">
                <CompanyBadge company={job.company} size={44} className="rounded-xl" />
                <span className="flex min-w-0 flex-col">
                    <span className="text-[13px] text-ink-3">{t('applyingAt', { company: job.company })}</span>
                    <strong className="text-[15px] font-semibold leading-[1.35]">{job.title}</strong>
                    <span className="text-[13px] text-ink-3">{city(job, o('remote'))}</span>
                </span>
            </div>
            <LogoReading label={t('writingTitle')} />
            <h1 className="m-0 text-[30px] font-extrabold">{t('writingTitle')}</h1>
            <p role="status" className="m-0 max-w-[420px] text-base leading-[1.6] text-ink-3">
                {t('writingText')}
            </p>
            <div className="flex w-full max-w-[420px] flex-col gap-2.5 pt-2">
                <Sk className="h-3.5 w-full rounded" />
                <Sk className="h-3.5 w-[92%] rounded" />
                <Sk className="h-3.5 w-[78%] rounded" />
            </div>
        </section>
    )
}

type SentInfo = { app: Application; later: Date | null }

// Sent is the last step: what happened, where to follow it, and two offers close to this one.
function Sent({ job, sent, gmail }: { job: Job; sent: SentInfo; gmail?: string }) {
    const t = useTranslations('apply')
    const o = useTranslations('offers')
    const format = useFormatter()
    const similar = useSimilarJobs(job.id, true)
    const self = sent.app.via === 'self'
    const date = (d: Date) => format.dateTime(d, { weekday: 'long', day: 'numeric', month: 'long' })
    const time = (d: Date) => format.dateTime(d, { hour: 'numeric', minute: '2-digit' })
    const title = self ? t('sentSelfTitle') : sent.later ? t('sentLaterTitle') : t('sentTitle', { company: job.company })
    const text = self
        ? t('sentSelfText', { company: job.company, date: format.dateTime(followUpOn(sent.app), { day: 'numeric', month: 'long' }) })
        : sent.later
          ? t('sentLaterText', { date: date(sent.later), time: time(sent.later), gmail: gmail ?? 'Gmail' })
          : t('sentText', { gmail: gmail ?? 'Gmail' })
    const others = (similar.data?.items ?? []).slice(0, 2)
    return (
        <section aria-live="polite" className="flex flex-col items-center gap-7 pt-6">
            <div className="box-border flex w-full max-w-[620px] flex-col items-center gap-3.5 rounded-3xl border-[1.5px] border-ink bg-white px-10 py-11 text-center shadow-pop">
                <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-lime">
                    <Icon name={sent.later ? 'clock' : 'check'} size={30} strokeWidth={2.4} />
                </span>
                <h1 className="m-0 text-[34px] font-extrabold leading-[1.1]">{title}</h1>
                <p className="m-0 max-w-[460px] text-base leading-[1.6] text-ink-3">{text}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2.5">
                    <ButtonLink href="/applications" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('follow')}
                    </ButtonLink>
                    <ButtonLink href="/jobs" variant="secondary" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('backToOffers')}
                    </ButtonLink>
                </div>
            </div>
            {others.length ? (
                <div className="flex w-full max-w-[620px] flex-col gap-3">
                    <h2 className="m-0 text-[19px] font-extrabold">{t('nearby', { count: others.length })}</h2>
                    {others.map((s) => (
                        <Link
                            key={s.id}
                            href={`/jobs?tab=all&job=${s.id}`}
                            className="flex items-center gap-3.5 rounded-2xl bg-white p-4 text-ink no-underline hover:text-ink"
                        >
                            <CompanyBadge company={s.company} size={44} className="rounded-xl" />
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <strong className="text-[15px] font-semibold">{s.title}</strong>
                                <span className="text-[13.5px] text-ink-3">{[s.company, city(s, o('remote'))].filter(Boolean).join(' · ')}</span>
                            </span>
                            <span className="text-sm font-semibold text-violet">{s.easy_apply ? o('apply') : o('similarSee')}</span>
                        </Link>
                    ))}
                </div>
            ) : null}
        </section>
    )
}

function Line({ ok, mark, title, hint, children }: { ok: boolean; mark?: string; title: string; hint: string; children?: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3">
            <span
                className={cn(dot, ok ? 'bg-ok-bg text-ok-fg' : 'border-[1.5px] border-dashed border-[#B9ABF5] bg-white text-[13px] font-bold text-[#7A5CF0]')}
            >
                {ok ? <Icon name="check" size={12} strokeWidth={3} /> : (mark ?? '+')}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="text-[14.5px] font-semibold">{title}</strong>
                <span className="text-[13px] text-ink-3">{hint}</span>
            </span>
            {children}
        </li>
    )
}

// ApplyScreen is screen « Postuler »: the letter written for this offer, made the student's own, then sent from
// their Gmail (now or later) or taken to the site of the offer.
export default function ApplyScreen({ id }: { id: string }) {
    const t = useTranslations('apply')
    const tc = useTranslations('common')
    const o = useTranslations('offers')
    const format = useFormatter()
    const locale = useLocale()
    const router = useRouter()
    const params = useSearchParams()
    const toast = useToast()
    const { user } = useSessionContext()

    const jobQ = useJob(id)
    const job = jobQ.data
    const my = useMyCv()
    const resume = useResume(my.id ?? '').data
    const gmail = useGmailStatus()
    const apps = useApplications()
    const draft = useDraft()
    const apply = useApply()

    const [tone, setTone] = useState<Tone>('formal')
    const [language, setLanguage] = useState<LetterLanguage>(locale === 'en' || locale === 'ar' ? locale : 'fr')
    const [nonce, setNonce] = useState(0)
    const [subject, setSubject] = useState('')
    const [paras, setParas] = useState<string[]>([])
    const [own, setOwn] = useState('')
    const [read, setRead] = useState(false)
    const [later, setLater] = useState(false)
    const [slot, setSlot] = useState<'next' | 'monday' | 'custom'>('next')
    const [custom, setCustom] = useState('')
    const [modal, setModal] = useState<'' | 'gmail' | 'plan' | 'download'>('')
    const [self, setSelf] = useState(params.get('cv') === '1')
    const [did, setDid] = useState({ cv: false, letter: false, site: false })
    const [busy, setBusy] = useState(false)
    const [sent, setSent] = useState<SentInfo | null>(null)
    const [byHand, setByHand] = useState(false)

    // Back from Google: the letter the student left with is put back instead of being written again.
    const asked = useRef('')
    const key = `${id}|${tone}|${language}|${nonce}`
    useEffect(() => {
        const p = takePending(id)
        if (!p) return
        asked.current = `${id}|${p.tone}|${p.language}|0`
        setTone(p.tone)
        setLanguage(p.language)
        setSubject(p.subject)
        setParas(p.paras)
        setOwn(p.own)
        setLater(p.later)
        if (p.at) {
            setSlot('custom')
            setCustom(p.at)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
    useEffect(() => {
        const g = params.get('gmail')
        if (g === 'connected') toast(t('gmailConnected'))
        if (g === 'denied' || g === 'error') toast(t('gmailFailed'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // No letter is written for an offer the student already applied to.
    const already = apps.data?.items.some((a) => a.job_id === id && live(a)) ?? false
    const { mutate: write } = draft
    useEffect(() => {
        if (!job || !my.ready || !my.id || apps.isLoading || already || byHand || asked.current === key) return
        asked.current = key
        write(
            { job_id: id, resume_id: my.id, language, tone },
            {
                onSuccess: (d) => {
                    if (asked.current !== key) return
                    setSubject(d.subject)
                    setParas(paragraphs(d.body))
                    setRead(false)
                },
            },
        )
    }, [job, my.ready, my.id, apps.isLoading, already, byHand, key, id, language, tone, write])

    const closed = job ? deadline(job.closes_on)?.kind === 'closed' : false
    useEffect(() => {
        if (closed) router.replace(`/jobs/${id}`)
    }, [closed, id, router])

    if (jobQ.isError) {
        return (
            <Shell id={id}>
                <Notice title={t('goneTitle')} text={t('goneText')}>
                    <ButtonLink href="/jobs">{t('backToOffers')}</ButtonLink>
                </Notice>
            </Shell>
        )
    }
    if (!job || !my.ready || apps.isLoading || closed) {
        return (
            <Shell id={id}>
                <div aria-busy="true" className="flex flex-col gap-4 pt-4">
                    <Sk className="h-9 w-[60%] rounded-lg" />
                    <Sk className="h-[420px] w-full rounded-2xl" />
                </div>
            </Shell>
        )
    }
    if (sent) {
        return (
            <Shell id={id} done>
                <Sent job={job} sent={sent} gmail={gmail.data?.email} />
            </Shell>
        )
    }
    if (already) {
        return (
            <Shell id={id} done>
                <Notice title={t('alreadyTitle')} text={t('alreadyText', { company: job.company })}>
                    <ButtonLink href="/applications">{t('follow')}</ButtonLink>
                    <ButtonLink href="/jobs" variant="secondary">
                        {t('backToOffers')}
                    </ButtonLink>
                </Notice>
            </Shell>
        )
    }
    if (!my.id) {
        return (
            <Shell id={id}>
                <Notice title={t('noCvTitle')} text={t('noCvText')}>
                    <ButtonLink href="/resumes/upload">{t('noCvAction')}</ButtonLink>
                </Notice>
            </Shell>
        )
    }
    if (!paras.length && !byHand) {
        if (draft.isError) {
            return (
                <Shell id={id}>
                    <Notice title={t('draftErrorTitle')} text={t('draftErrorText')}>
                        <Button onClick={() => setNonce((n) => n + 1)}>{tc('retry')}</Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setByHand(true)
                                setSubject(t('blankSubject', { title: job.title }))
                                setParas([t('blankGreeting'), '', t('blankClosing'), user?.name ?? ''])
                            }}
                        >
                            {t('writeMyself')}
                        </Button>
                    </Notice>
                </Shell>
            )
        }
        return (
            <Shell id={id}>
                <Writing job={job} />
            </Shell>
        )
    }

    // onSite: the offer only takes applications on the site it was found on; external also covers a student who
    // chose to send a 1-click offer from their own mailbox.
    const onSite = !job.easy_apply
    const external = self || onSite
    const source = sourceName(job.source)
    const place = city(job, o('remote'))
    const suggested = slots()
    const at = !later ? null : slot === 'custom' ? (custom ? new Date(custom) : null) : (suggested.find((s) => s.key === slot)?.at ?? null)
    const timeOk = !later || validTime(at)
    const ready = read && timeOk && !!subject.trim() && paras.some((p) => p.trim())
    const body = compose(paras, own)
    const ownAt = ownIndex(paras)
    const slotLabel = (d: Date, tomorrow: boolean) => {
        const day = format.dateTime(d, { weekday: 'long', day: 'numeric', month: 'short' })
        return `${tomorrow ? t('tomorrow', { day }) : day} · ${format.dateTime(d, { hour: 'numeric', minute: '2-digit' })}`
    }

    const failed = (e: unknown) => {
        const { status, message } = errorOf(e)
        const kind = applyError(status, message)
        if (kind === 'plan') setModal('plan')
        else if (kind === 'gmail') setModal('gmail')
        else if (kind === 'noEmail') {
            setSelf(true)
            toast(t('noEmail', { source }))
        } else if (kind === 'closed') router.replace(`/jobs/${id}`)
        else if (kind === 'already') apps.refetch()
        else toast(tc('error'))
    }

    const send = async () => {
        if (!ready || busy) return
        if (!gmail.data?.connected) return setModal('gmail')
        setBusy(true)
        try {
            const app = await apply.mutateAsync({
                job_id: id,
                resume_id: my.id,
                subject: subject.trim(),
                body,
                scheduled_at: at ? at.toISOString() : undefined,
            })
            setSent({ app, later: app.status === 'scheduled' ? at : null })
        } catch (e) {
            failed(e)
        } finally {
            setBusy(false)
        }
    }

    const connect = async () => {
        savePending({ jobId: id, subject, paras, own, tone, language, later, at: at && later ? localInput(at) : '' })
        setBusy(true)
        try {
            const { data } = await EmailService.connectGmail()
            window.location.assign(data.url)
        } catch {
            setBusy(false)
            toast(t('gmailUnavailable'))
        }
    }

    const downloadCv = async () => {
        setBusy(true)
        try {
            const { data: file } = await ResumeService.exportResume(my.id!, 'pdf')
            const { data: blob } = await ResumeService.downloadFile(my.id!, file.id)
            saveBlob(blob, file.filename)
            setDid((d) => ({ ...d, cv: true }))
        } catch (e) {
            if (errorOf(e).status === 402) setModal('download')
            else toast(tc('error'))
        } finally {
            setBusy(false)
        }
    }

    const copyLetter = async () => {
        try {
            await navigator.clipboard.writeText(`${subject.trim()}\n\n${body}`)
            setDid((d) => ({ ...d, letter: true }))
            toast(t('copied'))
        } catch {
            toast(tc('error'))
        }
    }

    const sentMyself = async () => {
        setBusy(true)
        try {
            const app = await apply.mutateAsync({ job_id: id, resume_id: my.id, via: 'self' })
            setSent({ app, later: null })
        } catch (e) {
            failed(e)
        } finally {
            setBusy(false)
        }
    }

    const rewriting = draft.isPending
    const doneCount = [did.cv, did.letter, did.site].filter(Boolean).length
    const stepBtn = buttonClass('secondary', 'md', 'h-12 w-full justify-start gap-2.5 rounded-xl px-4 text-[15px]')

    return (
        <Shell id={id}>
            <div className="flex flex-wrap items-start gap-8">
                <section aria-label={t('letterRegion')} className="flex min-w-0 flex-[999_1_600px] flex-col gap-[18px]">
                    <div className="flex flex-col gap-2">
                        <span className={eyebrow}>{[job.company, onSite ? t('offerOn', { source }) : place].filter(Boolean).join(' · ')}</span>
                        <h1 className="m-0 text-[38px] font-extrabold leading-[1.08]">
                            {onSite ? t('titleExternal', { source }) : external ? t('titleSelf') : t('title')}
                        </h1>
                        <p className="m-0 max-w-[620px] text-base leading-[1.55] text-ink-3">
                            {onSite ? t('introExternal', { source }) : external ? t('introSelf') : t('intro')}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-white p-[18px]">
                        <label htmlFor="own" className="flex flex-wrap items-baseline justify-between gap-3">
                            <strong className="text-[15px] font-semibold">{t('ownLabel', { company: job.company })}</strong>
                            <span className="text-[13px] text-ink-3">{t('ownOptional')}</span>
                        </label>
                        <input
                            id="own"
                            type="text"
                            dir="auto"
                            maxLength={300}
                            value={own}
                            onChange={(e) => setOwn(e.target.value)}
                            placeholder={t('ownPlaceholder')}
                            className="box-border h-12 w-full rounded-xl border-[1.5px] border-line-strong px-3.5 text-[15px] text-ink placeholder:text-ink-4"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
                            <span>{t('ideas')}</span>
                            {(['idea1', 'idea2', 'idea3'] as const).map((k) => (
                                <span key={k} className="rounded-full bg-fill px-2.5 py-1">
                                    {t(k)}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Segmented
                            label={t('tone')}
                            role="radiogroup"
                            value={tone}
                            onChange={setTone}
                            className="gap-1 p-1"
                            itemClassName="h-[34px] px-3.5 text-sm"
                            options={[
                                { value: 'formal', label: t('toneFormal'), disabled: byHand },
                                { value: 'friendly', label: t('toneDirect'), disabled: byHand },
                            ]}
                        />
                        <div className="flex items-center gap-2">
                            <label>
                                <span className="sr-only">{t('language')}</span>
                                <select
                                    value={language}
                                    disabled={byHand}
                                    onChange={(e) => setLanguage(e.target.value as LetterLanguage)}
                                    className="h-10 rounded-[10px] border border-line-strong bg-white px-2.5 text-sm text-ink-2"
                                >
                                    <option value="fr">{t('langFr')}</option>
                                    <option value="en">{t('langEn')}</option>
                                    <option value="ar">{t('langAr')}</option>
                                </select>
                            </label>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-10 font-medium text-ink-2"
                                disabled={rewriting || byHand}
                                onClick={() => setNonce((n) => n + 1)}
                            >
                                {rewriting ? t('rewriting') : t('rewrite')}
                            </Button>
                        </div>
                    </div>

                    <article
                        lang={language}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                        aria-label={t('preview')}
                        aria-busy={rewriting}
                        className={cn(
                            'flex flex-col gap-4 rounded-md bg-white px-8 py-10 text-[15.5px] leading-[1.8] text-[#1D2939] shadow-paper md:px-16 md:py-14',
                            rewriting && 'opacity-50',
                        )}
                    >
                        <dl
                            dir={locale === 'ar' ? 'rtl' : 'ltr'}
                            className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-line-soft pb-4 text-[13.5px] leading-[1.5] text-ink-3"
                        >
                            <dt>{t('from')}</dt>
                            <dd className="m-0 text-ink">{gmail.data?.connected ? gmail.data.email : (user?.name ?? t('you'))}</dd>
                            <dt>{t('to')}</dt>
                            <dd className="m-0 text-ink">{t('recruiter', { company: job.company })}</dd>
                            <dt>{t('attached')}</dt>
                            <dd className="m-0 text-ink">{t('attachedCv', { title: resume?.title ?? 'CV' })}</dd>
                        </dl>
                        <div className="flex items-baseline gap-2 font-semibold text-ink">
                            <span className="flex-none">{t('subject')}</span>
                            <div className="min-w-0 flex-1">
                                <Para value={subject} label={t('subjectLabel')} onChange={(v) => setSubject(v.replace(/\n/g, ' ').slice(0, 200))} />
                            </div>
                        </div>
                        {paras.map((p, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <Para
                                    value={p}
                                    label={t('paragraph', { n: i + 1 })}
                                    onChange={(v) => {
                                        setParas((all) => all.map((x, k) => (k === i ? v : x)))
                                        setRead(false)
                                    }}
                                />
                                {i === ownAt ? (
                                    sentence(own) ? (
                                        <span className="self-start rounded-sm bg-violet-soft px-0.5 shadow-[inset_0_-2px_0_#4B32E0]">{sentence(own)}</span>
                                    ) : (
                                        <span className="self-start rounded-md border-[1.5px] border-dashed border-[#B9ABF5] px-2 py-px text-sm text-[#7A5CF0]">
                                            {t('ownSlot')}
                                        </span>
                                    )
                                ) : null}
                            </div>
                        ))}
                    </article>
                    <div className="flex flex-wrap gap-[18px] text-[13px] text-ink-3">
                        <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-2.5 w-[18px] rounded-sm bg-violet-soft shadow-[inset_0_-2px_0_#4B32E0]" />
                            {t('legendOwn')}
                        </span>
                        <span>{t('legendEdit')}</span>
                    </div>
                </section>

                <aside
                    aria-label={t('sendRegion')}
                    className="sticky top-[92px] flex min-w-0 flex-[1_1_340px] flex-col gap-5 rounded-[20px] border-[1.5px] border-ink bg-white p-6 shadow-card"
                >
                    <div className="flex items-center gap-3">
                        <CompanyBadge company={job.company} size={44} className="rounded-xl" />
                        <div className="flex min-w-0 flex-col">
                            <strong className="text-[15px] font-semibold leading-[1.35]">{job.title}</strong>
                            <span className="text-[13px] text-ink-3">
                                {job.company}
                                {job.closes_on ? ' · ' : ''}
                                <DeadlineText closesOn={job.closes_on} />
                            </span>
                        </div>
                    </div>

                    {external ? (
                        <>
                            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                                <li>
                                    <button type="button" className={stepBtn} disabled={busy} onClick={downloadCv}>
                                        <Icon name={did.cv ? 'check' : 'download'} />
                                        {t('selfCv')}
                                    </button>
                                </li>
                                <li>
                                    <button type="button" className={stepBtn} onClick={copyLetter}>
                                        <Icon name={did.letter ? 'check' : 'file'} />
                                        {t('selfCopy')}
                                    </button>
                                </li>
                                {job.source_url ? (
                                    <li>
                                        <a
                                            href={job.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(stepBtn, 'text-ink hover:text-ink')}
                                            onClick={() => setDid((d) => ({ ...d, site: true }))}
                                        >
                                            <Icon name={did.site ? 'check' : 'link'} />
                                            {onSite ? t('selfOpen', { source }) : t('selfOpenOffer')}
                                        </a>
                                    </li>
                                ) : null}
                            </ol>
                            <span className="text-[13px] text-ink-3">{t('selfCount', { done: doneCount, total: job.source_url ? 3 : 2 })}</span>
                            <Button size="lg" className="h-[54px] w-full text-base" disabled={busy} onClick={sentMyself}>
                                {onSite ? t('selfDone', { source }) : t('selfSent')}
                            </Button>
                            <p className="-mt-2 mb-0 text-center text-[13px] leading-[1.5] text-ink-3">{t('selfNote')}</p>
                            {job.easy_apply ? (
                                <Button variant="link" className="self-center text-sm" onClick={() => setSelf(false)}>
                                    {t('selfBack')}
                                </Button>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                                <Line ok title={t('lineCv')} hint={resume?.title ?? ''}>
                                    <Link href={`/resumes/${my.id}`} className="text-[13.5px] font-medium">
                                        {t('see')}
                                    </Link>
                                </Line>
                                <Line ok title={t('lineLetter')} hint={t('lineLetterHint')} />
                                <Line ok={!!sentence(own)} title={t('lineOwn')} hint={sentence(own) ? t('lineOwnDone') : t('lineOwnHint')} />
                            </ul>
                            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-fill-3 p-3.5 text-sm leading-[1.5]">
                                <input
                                    type="checkbox"
                                    checked={read}
                                    onChange={(e) => setRead(e.target.checked)}
                                    className="mt-px h-5 w-5 flex-none accent-ink"
                                />
                                <span>{t('readIt')}</span>
                            </label>
                            <Segmented
                                label={t('when')}
                                role="radiogroup"
                                value={later ? 'later' : 'now'}
                                onChange={(v) => setLater(v === 'later')}
                                className="grid grid-cols-2 gap-1.5 p-1"
                                itemClassName="whitespace-nowrap px-1"
                                options={[
                                    { value: 'now', label: t('now') },
                                    { value: 'later', label: t('later') },
                                ]}
                            />
                            {later ? (
                                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                                    {t('sendOn')}
                                    <select
                                        value={slot}
                                        onChange={(e) => setSlot(e.target.value as typeof slot)}
                                        className="h-11 rounded-xl border border-line-strong bg-white px-3 text-[14.5px] text-ink"
                                    >
                                        {suggested.map((s) => (
                                            <option key={s.key} value={s.key}>
                                                {slotLabel(s.at, s.tomorrow)}
                                            </option>
                                        ))}
                                        <option value="custom">{t('pickTime')}</option>
                                    </select>
                                    {slot === 'custom' ? (
                                        <input
                                            type="datetime-local"
                                            aria-label={t('pickTime')}
                                            aria-invalid={!timeOk}
                                            min={localInput(new Date(Date.now() + 10 * 60_000))}
                                            value={custom}
                                            onChange={(e) => setCustom(e.target.value)}
                                            className={inputClass}
                                        />
                                    ) : null}
                                    <span className="text-[12.5px] font-normal text-ink-3">{timeOk ? t('laterHint') : t('laterInvalid')}</span>
                                </label>
                            ) : null}
                            <button
                                type="button"
                                onClick={send}
                                aria-disabled={!ready || busy}
                                className={cn(
                                    'flex h-[54px] items-center justify-center gap-2.5 rounded-[14px] border-0 text-base font-semibold',
                                    ready && !busy ? 'cursor-pointer bg-ink text-white' : 'cursor-not-allowed bg-line text-ink-3',
                                )}
                            >
                                <Icon name={later ? 'clock' : 'send'} size={18} stroke={ready && !busy ? '#D6F25E' : 'currentColor'} />
                                {busy ? t('sending') : later ? t('scheduleSend') : t('sendTo', { company: job.company })}
                            </button>
                            <p className="-mt-2 mb-0 text-center text-[13px] leading-[1.5] text-ink-3">
                                {!read
                                    ? t('noteCheck')
                                    : gmail.data?.connected
                                      ? t('noteFrom', { gmail: gmail.data.email ?? 'Gmail', company: job.company })
                                      : t('noteConnect')}
                            </p>
                            <Button variant="link" className="self-center text-sm" onClick={() => setSelf(true)}>
                                {t('preferSelf')}
                            </Button>
                        </>
                    )}
                </aside>
            </div>

            <Modal open={modal === 'gmail'} onClose={() => setModal('')} eyebrow={t('gmailEyebrow')} title={t('gmailTitle')}>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {([1, 2, 3] as const).map((n) => (
                        <li key={n} className="flex items-start gap-3">
                            <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-lime text-xs font-bold">✓</span>
                            <span className="flex flex-col gap-0.5">
                                <strong className="text-[15px]">{t(`gmailPoint${n}`)}</strong>
                                <span className="text-sm leading-[1.5] text-ink-3">{t(`gmailPoint${n}Text`)}</span>
                            </span>
                        </li>
                    ))}
                </ul>
                <Button size="lg" className="w-full" disabled={busy} onClick={connect}>
                    {t('gmailConnect')}
                </Button>
                <Button
                    variant="link"
                    className="self-center text-sm"
                    onClick={() => {
                        setModal('')
                        setSelf(true)
                    }}
                >
                    {t('preferSelf')}
                </Button>
            </Modal>

            <Modal open={modal === 'plan'} onClose={() => setModal('')} eyebrow={t('planEyebrow')} title={t('planTitle')}>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-3">{t('planText')}</p>
                <ButtonLink href="/settings/billing" size="lg" className="w-full">
                    {t('planSee')}
                </ButtonLink>
                <Button
                    variant="link"
                    className="self-center text-sm"
                    onClick={() => {
                        setModal('')
                        setSelf(true)
                    }}
                >
                    {t('planSelf')}
                </Button>
            </Modal>

            <Modal open={modal === 'download'} onClose={() => setModal('')} eyebrow={t('planEyebrow')} title={t('downloadTitle')}>
                <p className="m-0 text-[15px] leading-[1.6] text-ink-3">{t('downloadText')}</p>
                <ButtonLink href="/settings/billing" size="lg" className="w-full">
                    {t('planSee')}
                </ButtonLink>
                <Link href={`/resumes/${my.id}`} className="self-center text-sm font-semibold no-underline">
                    {t('downloadOpen')}
                </Link>
            </Modal>
        </Shell>
    )
}
