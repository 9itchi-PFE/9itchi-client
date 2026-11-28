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
import { Select } from '@/components/ui/Select'
import AttachmentFields from '@/components/outreach/AttachmentFields'
import CompanyRecruiters from '@/components/outreach/CompanyRecruiters'
import { firstChoice, letterFields, letterStem, sameName, type LetterChoice } from '@/components/outreach/attachments'
import { useMe } from '@/hooks/useAccount'
import { useAllowance, useApplications, useApply, useDraft, useGmailStatus } from '@/hooks/useApplications'
import { useAttachmentNames } from '@/hooks/useEmails'
import { useJob, useSimilarJobs } from '@/hooks/useJobs'
import { useMyCv, useResume, useResumes } from '@/hooks/useResumes'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/cn'
import { quotaReason } from '@/utils/quota'
import EmailService from '@/services/EmailService'
import ResumeService from '@/services/ResumeService'
import type { Application, LetterLanguage, Tone } from '@/types/application'
import type { Job } from '@/types/job'
import { saveBlob } from '@/utils/saveBlob'
import {
    applyError,
    compose,
    followUpOn,
    live,
    localInput,
    ownIndex,
    paragraphs,
    savePending,
    sending,
    sentence,
    slots,
    takePending,
    validTime,
    signature,
    validEmail,
} from './apply'

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
        <main className="mx-auto box-border flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-4 sm:px-8 pb-[72px] pt-3">
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
    const me = useMe()
    const ts = useTranslations('settings')
    const tm = useTranslations('outreach.composer')

    const jobQ = useJob(id)
    const job = jobQ.data
    const my = useMyCv()
    const cvs = useResumes()
    // The CV sent: the latest one unless the student picks another. letterCv is the one the letter was written with.
    const [cvId, setCvId] = useState('')
    const [letterCv, setLetterCv] = useState('')
    const [askCv, setAskCv] = useState('')
    const cv = cvId || my.id || ''
    const resume = useResume(cv).data
    const gmail = useGmailStatus()
    const apps = useApplications()
    const allowance = useAllowance()
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
    // byEmail: an offer with no application address, sent from Gmail to the address the student found.
    const [byEmail, setByEmail] = useState(false)
    const [to, setTo] = useState('')
    // toMode: the student types the recruiter's address, or finds the recruiter at the company (Recruiter Radar).
    const [toMode, setToMode] = useState<'type' | 'find'>('type')
    // letter: the cover letter PDF that goes with the email, under the default name until the student types one.
    const [letter, setLetter] = useState<LetterChoice>(firstChoice)
    const names = useAttachmentNames(cv, language)
    const edited = useRef(false)

    // Back from Google: the letter the student left with is put back instead of being written again.
    const asked = useRef('')
    const hasLetter = useRef(false)
    hasLetter.current = paras.length > 0
    const key = `${id}|${tone}|${language}|${nonce}|${letterCv}`
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
        if (p.cv) {
            setCvId(p.cv)
            setLetterCv(p.cv)
            asked.current = `${id}|${p.tone}|${p.language}|0|${p.cv}`
        }
        if (p.to) {
            setTo(p.to)
            setByEmail(true)
        }
        if (p.letter) setLetter(p.letter)
        edited.current = true
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
            { job_id: id, resume_id: letterCv || my.id, language, tone, fresh: nonce > 0 },
            {
                onSuccess: (d) => {
                    if (asked.current !== key) return
                    setSubject(d.subject)
                    setParas(paragraphs(d.body))
                    setRead(false)
                    edited.current = false
                },
                onError: (e) => {
                    // With a letter already on screen, it stays: the student is told why no new one came.
                    if (asked.current !== key || !hasLetter.current) return
                    const why = quotaReason(e)
                    toast(why === 'used' ? t('draftUsedToast') : why === 'plan' ? t('draftPlanToast') : t('draftErrorTitle'))
                },
            },
        )
    }, [job, my.ready, my.id, apps.isLoading, already, byHand, key, id, language, tone, nonce, letterCv, write, toast, t])

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
            const why = quotaReason(draft.error)
            return (
                <Shell id={id}>
                    <Notice
                        title={why === 'used' ? t('draftUsedTitle') : why === 'plan' ? t('draftPlanTitle') : t('draftErrorTitle')}
                        text={why ? t('draftLimitText') : t('draftErrorText')}
                    >
                        {why ? (
                            <ButtonLink variant="secondary" href="/settings/billing">
                                {t('seePlans')}
                            </ButtonLink>
                        ) : (
                            <Button onClick={() => setNonce((n) => n + 1)}>{tc('retry')}</Button>
                        )}
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
    const external = self || (onSite && !byEmail)
    const source = sourceName(job.source)
    const place = city(job, o('remote'))
    const suggested = slots()
    const at = !later ? null : slot === 'custom' ? (custom ? new Date(custom) : null) : (suggested.find((s) => s.key === slot)?.at ?? null)
    const timeOk = !later || validTime(at)
    const cvFilename = names.data?.cv_filename ?? ''
    const letterSame = letter.attach && sameName(letterStem(letter, names.data), cvFilename)
    const ready = read && timeOk && !!subject.trim() && paras.some((p) => p.trim()) && (!onSite || validEmail(to)) && !letterSame
    const sig = signature(me.data, (y) => ts(`years.${y}` as 'years.l3'))
    const body = compose(paras, own, sig)
    const ownAt = ownIndex(paras)
    const slotLabel = (d: Date, tomorrow: boolean) => {
        const day = format.dateTime(d, { weekday: 'long', day: 'numeric', month: 'short' })
        return `${tomorrow ? t('tomorrow', { day }) : day} · ${format.dateTime(d, { hour: 'numeric', minute: '2-digit' })}`
    }

    // way: how this application leaves. Without a subscription it carries the imported file, a few times.
    const way = sending(allowance.data)

    const failed = (e: unknown) => {
        const { status, message } = errorOf(e)
        const kind = applyError(status, message)
        if (kind === 'plan') {
            allowance.refetch()
            setModal('plan')
        } else if (kind === 'noFile') toast(t('noFile'))
        else if (kind === 'letterFailed' || kind === 'tooLarge') toast(tm(kind))
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
        if (way.kind === 'blocked') return setModal('plan')
        if (!gmail.data?.connected) return setModal('gmail')
        setBusy(true)
        try {
            const app = await apply.mutateAsync({
                job_id: id,
                resume_id: cv,
                to: onSite ? to.trim() : undefined,
                subject: subject.trim(),
                body,
                scheduled_at: at ? at.toISOString() : undefined,
                ...letterFields(letter, names.data, language),
            })
            setSent({ app, later: app.status === 'scheduled' ? at : null })
        } catch (e) {
            failed(e)
        } finally {
            setBusy(false)
        }
    }

    const connect = async () => {
        savePending({
            jobId: id,
            subject,
            paras,
            own,
            tone,
            language,
            later,
            at: at && later ? localInput(at) : '',
            cv: letterCv || cv,
            to: onSite ? to.trim() : undefined,
            letter,
        })
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
            const { data: file } = await ResumeService.exportResume(cv, 'pdf')
            const { data: blob } = await ResumeService.downloadFile(cv, file.id)
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
            const app = await apply.mutateAsync({ job_id: id, resume_id: cv, via: 'self' })
            setSent({ app, later: null })
        } catch (e) {
            failed(e)
        } finally {
            setBusy(false)
        }
    }

    // choose sends another CV. The letter was written from the CV: it is written again from the new one, unless the
    // student changed it, who is asked first (keeping the letter keeps the new CV too).
    const choose = (v: string) => {
        setCvId(v)
        if (byHand || v === (letterCv || my.id)) return
        if (edited.current) setAskCv(v)
        else setLetterCv(v)
    }
    const cvItems = cvs.data?.items ?? []
    const toBad = onSite && byEmail && to.trim() !== '' && !validEmail(to)

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
                            {onSite && !byEmail ? t('titleExternal', { source }) : external ? t('titleSelf') : t('title')}
                        </h1>
                        <p className="m-0 max-w-[620px] text-base leading-[1.55] text-ink-3">
                            {onSite && !byEmail ? t('introExternal', { source }) : external ? t('introSelf') : t('intro')}
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
                                <Select
                                    value={language}
                                    disabled={byHand}
                                    onChange={(e) => setLanguage(e.target.value as LetterLanguage)}
                                    className="h-10 rounded-[10px] border border-line-strong bg-white px-2.5 text-sm text-ink-2"
                                >
                                    <option value="fr">{t('langFr')}</option>
                                    <option value="en">{t('langEn')}</option>
                                    <option value="ar">{t('langAr')}</option>
                                </Select>
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
                            <dd className="m-0 text-ink" dir={byEmail && to ? 'ltr' : undefined}>
                                {byEmail && to.trim() ? to.trim() : t('recruiter', { company: job.company })}
                            </dd>
                            <dt>{t('attached')}</dt>
                            <dd className="m-0 text-ink">
                                {way.kind === 'original' ? t('attachedOriginal') : t('attachedCv', { title: resume?.title ?? 'CV' })}
                            </dd>
                        </dl>
                        <div className="flex items-baseline gap-2 font-semibold text-ink">
                            <span className="flex-none">{t('subject')}</span>
                            <div className="min-w-0 flex-1">
                                <Para
                                    value={subject}
                                    label={t('subjectLabel')}
                                    onChange={(v) => {
                                        edited.current = true
                                        setSubject(v.replace(/\n/g, ' ').slice(0, 200))
                                    }}
                                />
                            </div>
                        </div>
                        {paras.map((p, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <Para
                                    value={p}
                                    label={t('paragraph', { n: i + 1 })}
                                    onChange={(v) => {
                                        edited.current = true
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
                        {sig.length ? (
                            <div aria-label={t('signature')} className="flex flex-col text-[14.5px] leading-[1.5] text-ink-2">
                                {sig.map((l) => (
                                    <span key={l} dir="auto">
                                        {l}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </article>
                    <p className="m-0 text-[13px] text-ink-3">
                        {sig.length ? t('signatureFrom') : t('signatureNone')}{' '}
                        <Link href="/settings" className="font-medium underline">
                            {t('signatureEdit')}
                        </Link>
                    </p>
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

                    {cvItems.length > 1 ? (
                        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                            {t('cvPick')}
                            <span className="flex items-center gap-2">
                                <span className="min-w-0 flex-1">
                                    <Select value={cv} disabled={busy} onChange={(e) => choose(e.target.value)} className="text-[14.5px]">
                                        {cvItems.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.title}
                                            </option>
                                        ))}
                                    </Select>
                                </span>
                                <Link href={`/resumes/${cv}`} className="hit flex-none text-[13.5px] font-medium">
                                    {t('see')}
                                </Link>
                            </span>
                            <span className="text-[12.5px] font-normal text-ink-3">{t('cvPickHint')}</span>
                        </label>
                    ) : null}

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
                            {onSite && !self ? (
                                <Button variant="secondary" className="w-full gap-2" disabled={busy} onClick={() => setByEmail(true)}>
                                    <Icon name="send" size={16} />
                                    {t('byEmail')}
                                </Button>
                            ) : null}
                            {job.easy_apply ? (
                                <Button variant="link" className="self-center text-sm" onClick={() => setSelf(false)}>
                                    {t('selfBack')}
                                </Button>
                            ) : null}
                        </>
                    ) : (
                        <>
                            {onSite ? (
                                <div className="flex flex-col gap-1.5">
                                    <Segmented
                                        label={t('toHow')}
                                        role="radiogroup"
                                        value={toMode}
                                        onChange={setToMode}
                                        itemClassName="flex-1"
                                        options={[
                                            { value: 'type', label: t('toType') },
                                            { value: 'find', label: t('toFind') },
                                        ]}
                                    />
                                    {toMode === 'find' ? (
                                        <CompanyRecruiters
                                            company={job.company}
                                            goal={job.title || undefined}
                                            onPick={(email) => {
                                                setTo(email)
                                                setToMode('type')
                                            }}
                                        />
                                    ) : null}
                                    <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                                        {t('toLabel')}
                                        <input
                                            type="email"
                                            dir="ltr"
                                            autoComplete="off"
                                            value={to}
                                            maxLength={254}
                                            aria-invalid={toBad}
                                            placeholder={t('toPlaceholder')}
                                            onChange={(e) => setTo(e.target.value)}
                                            className={cn(inputClass, toBad && 'border-[#B42318]')}
                                        />
                                    </label>
                                    <span className={cn('text-[12.5px]', toBad ? 'text-[#B42318]' : 'text-ink-3')}>{toBad ? t('toBad') : t('toHint')}</span>
                                </div>
                            ) : null}
                            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                                <Line ok title={t('lineCv')} hint={resume?.title ?? ''}>
                                    <Link href={`/resumes/${cv}`} className="text-[13.5px] font-medium">
                                        {t('see')}
                                    </Link>
                                </Line>
                                <Line ok title={t('lineLetter')} hint={t('lineLetterHint')} />
                                <Line ok={!!sentence(own)} title={t('lineOwn')} hint={sentence(own) ? t('lineOwnDone') : t('lineOwnHint')} />
                            </ul>
                            <AttachmentFields cvFilename={cvFilename} names={names.data} value={letter} onChange={setLetter} disabled={busy} />
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
                                    <Select
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
                                    </Select>
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
                            {way.kind === 'original' ? (
                                <div
                                    role="note"
                                    className="flex flex-col gap-1.5 rounded-xl border border-line bg-page px-4 py-3.5 text-[13.5px] leading-[1.55] text-ink-2"
                                >
                                    <strong className="text-sm font-semibold text-ink">{t('freeLeft', { count: way.left, limit: way.limit })}</strong>
                                    <span>{t('freeText')}</span>
                                    <Link href="/settings/billing" className="self-start font-medium underline">
                                        {t('planSee')}
                                    </Link>
                                </div>
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
                                {onSite && !validEmail(to)
                                    ? t('noteTo')
                                    : !read
                                      ? t('noteCheck')
                                      : gmail.data?.connected
                                        ? t('noteFrom', { gmail: gmail.data.email ?? 'Gmail', company: job.company })
                                        : t('noteConnect')}
                            </p>
                            {onSite ? (
                                <Button variant="link" className="self-center text-sm" onClick={() => setByEmail(false)}>
                                    {t('byEmailBack', { source })}
                                </Button>
                            ) : (
                                <Button variant="link" className="self-center text-sm" onClick={() => setSelf(true)}>
                                    {t('preferSelf')}
                                </Button>
                            )}
                        </>
                    )}
                </aside>
            </div>

            <ConfirmDialog
                open={!!askCv}
                title={t('cvRewriteTitle')}
                confirmLabel={t('cvRewriteYes')}
                cancelLabel={t('cvRewriteKeep')}
                onConfirm={() => {
                    edited.current = false
                    setLetterCv(askCv)
                    setAskCv('')
                }}
                onClose={() => setAskCv('')}
            >
                {t('cvRewriteText')}
            </ConfirmDialog>

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

            <Modal
                open={modal === 'plan'}
                onClose={() => setModal('')}
                eyebrow={t('planEyebrow')}
                title={way.kind === 'blocked' && way.limit > 0 ? t('freeUsedTitle', { count: way.limit }) : t('planTitle')}
            >
                <p className="m-0 text-[15px] leading-[1.6] text-ink-3">{way.kind === 'blocked' && way.limit > 0 ? t('freeUsedText') : t('planText')}</p>
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
                <Link href={`/resumes/${cv}`} className="self-center text-sm font-semibold no-underline">
                    {t('downloadOpen')}
                </Link>
            </Modal>
        </Shell>
    )
}
