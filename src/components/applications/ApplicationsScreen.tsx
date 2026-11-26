'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { CompanyBadge } from '@/components/jobs/OfferCard'
import { Sk } from '@/components/jobs/OfferStates'
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useApplications, useEmail, useOpens, useSendNow, useUpdateApplication } from '@/hooks/useApplications'
import { useJobCounts } from '@/hooks/useJobs'
import { cn } from '@/lib/cn'
import type { Application } from '@/types/application'
import { applyError, bucket, followUpOn, sentAt, sentThisMonth } from './apply'

const card = 'flex flex-col gap-4 rounded-[18px] border border-line-soft bg-white p-5'
const small = 'hit h-8 rounded-[10px] px-3 text-[13.5px]'
const textBtn = 'hit cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-violet hover:text-violet-hover'

function Badge({ tone, children }: { tone: 'warn' | 'bad' | 'ok' | 'mute'; children: string }) {
    const tones = { warn: 'bg-warn-bg text-warn-fg', bad: 'bg-[#FEF3F2] text-[#B42318]', ok: 'bg-ok-bg text-ok-fg', mute: 'bg-fill text-ink-3' }
    return <span className={cn('whitespace-nowrap rounded-full px-[9px] py-[3px] text-xs font-semibold', tones[tone])}>{children}</span>
}

// Head is the top of a card: the company, how and when the application left, the topic, and something at the end.
function Head({ a, meta, children }: { a: Application; meta: string; children?: React.ReactNode }) {
    const t = useTranslations('applications')
    return (
        <div className="flex items-start gap-3.5">
            <CompanyBadge company={a.company || '?'} size={48} className="rounded-[14px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[13.5px] text-ink-3">
                    <strong className="font-semibold text-ink">{a.company}</strong>
                    {a.company ? ' · ' : ''}
                    {meta}
                </span>
                <Link href={`/jobs/${a.job_id}`} className="hit text-[17px] font-semibold leading-[1.35] text-ink no-underline hover:text-violet">
                    {a.job_title || t('offer')}
                </Link>
            </div>
            {children}
        </div>
    )
}

function Step({ on, lit, children }: { on: boolean; lit?: boolean; children: React.ReactNode }) {
    return (
        <span className={cn('flex items-center gap-2 text-[13px]', lit ? 'font-semibold' : on ? '' : 'text-ink-3')}>
            <span
                className={cn(
                    'h-2.5 w-2.5 flex-none rounded-full',
                    lit ? 'bg-[#9DB82A] shadow-[0_0_0_4px_#EEF7C9]' : on ? 'bg-ink' : 'box-border border-2 border-[#C9CDD5]',
                )}
            />
            {children}
        </span>
    )
}

const Rail = ({ on }: { on: boolean }) => <span className={cn('h-0.5 min-w-6 flex-1 rounded-sm', on ? 'bg-ink' : 'bg-line')} />

function LetterModal({ a, onClose }: { a: Application; onClose: () => void }) {
    const t = useTranslations('applications')
    const email = useEmail(a.email_id)
    return (
        <Modal open onClose={onClose} title={t('letterTitle', { company: a.company })} width={640}>
            {email.data ? (
                <div className="flex max-h-[60vh] flex-col gap-3 overflow-auto">
                    <span className="text-[13.5px] text-ink-3">{t('letterTo', { to: email.data.recipient })}</span>
                    <strong dir="auto" className="text-[15px]">
                        {email.data.subject}
                    </strong>
                    <p dir="auto" className="m-0 whitespace-pre-line text-[15px] leading-[1.75] text-[#1D2939]">
                        {email.data.body}
                    </p>
                </div>
            ) : (
                <Sk className="h-40 w-full rounded-lg" />
            )}
        </Modal>
    )
}

// Empty is screen EmptyApplications: nothing sent yet, and the three steps that lead here.
function Empty() {
    const t = useTranslations('applications')
    return (
        <main className="mx-auto box-border flex w-full max-w-[1000px] flex-1 flex-col gap-6 px-4 sm:px-8 pb-16 pt-8">
            <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
            <section className="flex flex-col items-center gap-3.5 rounded-3xl border-[1.5px] border-ink bg-white px-8 py-12 text-center shadow-pop">
                <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-lime">
                    <Icon name="send" size={28} />
                </span>
                <h2 className="m-0 text-[28px] font-extrabold">{t('emptyTitle')}</h2>
                <p className="m-0 max-w-[460px] text-base leading-[1.6] text-ink-3">{t('emptyText')}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2.5">
                    <ButtonLink href="/jobs" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('seeOffers')}
                    </ButtonLink>
                    <ButtonLink href="/resumes" variant="secondary" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('emptyCv')}
                    </ButtonLink>
                </div>
            </section>
            <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 p-0">
                {([1, 2, 3] as const).map((n) => (
                    <li key={n} className="flex flex-col gap-1.5 rounded-[18px] border border-line-soft bg-white p-5">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{t('step', { n })}</span>
                        <strong className="text-base font-semibold">{t(`step${n}`)}</strong>
                        <span className="text-sm leading-[1.5] text-ink-3">{t(`step${n}Text`)}</span>
                    </li>
                ))}
            </ol>
        </main>
    )
}

// ApplicationsScreen is « Mes candidatures »: what needs the student, what waits for an answer, what is over.
export default function ApplicationsScreen() {
    const t = useTranslations('applications')
    const tc = useTranslations('common')
    const format = useFormatter()
    const toast = useToast()
    const list = useApplications()
    const counts = useJobCounts()
    const update = useUpdateApplication()
    const sendNow = useSendNow()
    const [letter, setLetter] = useState<Application | null>(null)

    const now = new Date()
    const items = list.data?.items ?? []
    const todo = items.filter((a) => bucket(a, now) === 'todo')
    const waiting = items.filter((a) => bucket(a, now) === 'waiting')
    const done = items.filter((a) => bucket(a, now) === 'done')
    const opens = useOpens(items.filter((a) => a.via === 'gmail' && a.email?.status === 'sent' && bucket(a, now) !== 'done').map((a) => a.email!.id))

    if (list.isLoading) {
        return (
            <main aria-busy="true" className="mx-auto box-border flex w-full max-w-[1320px] flex-1 flex-col gap-4 px-4 sm:px-8 pb-16 pt-4">
                <Sk className="h-12 w-80 rounded-lg" />
                <Sk className="h-40 w-full max-w-[860px] rounded-[18px]" />
                <Sk className="h-40 w-full max-w-[860px] rounded-[18px]" />
            </main>
        )
    }
    if (list.isError) {
        return (
            <main className="mx-auto box-border flex w-full max-w-[1000px] flex-1 flex-col items-start gap-4 px-4 sm:px-8 pb-16 pt-8">
                <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p role="alert" className="m-0 text-base text-ink-3">
                    {tc('error')}
                </p>
                <Button onClick={() => list.refetch()}>{tc('retry')}</Button>
            </main>
        )
    }
    if (items.length === 0) return <Empty />

    const ago = (a: Application) => format.relativeTime(sentAt(a), now)
    const day = (d: Date) => format.dateTime(d, { day: 'numeric', month: 'long' })
    const meta = (a: Application) =>
        a.via === 'self' ? `${t('bySelf')} · ${ago(a)}` : a.status === 'scheduled' ? `${t('oneClick')} · ${t('scheduled')}` : `${t('oneClick')} · ${ago(a)}`
    const busy = update.isPending || sendNow.isPending
    const set = (a: Application, status: 'sent' | 'replied' | 'withdrawn' | 'closed', message = t('updated')) =>
        update.mutate({ id: a.id, status }, { onSuccess: () => toast(message), onError: () => toast(tc('error')) })
    const letterLink = (a: Application) =>
        a.email_id ? (
            <button type="button" className={textBtn} onClick={() => setLetter(a)}>
                {t('letter')}
            </button>
        ) : null
    const answers = (a: Application) => (
        <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-10 px-4 text-sm" disabled={busy} onClick={() => set(a, 'replied')}>
                {t('theyReplied')}
            </Button>
            <Button variant="link" className="px-2 text-sm font-semibold text-ink-3 hover:text-ink" disabled={busy} onClick={() => set(a, 'withdrawn')}>
                {t('notInterested')}
            </Button>
        </div>
    )

    return (
        <main className="mx-auto box-border flex w-full max-w-[1320px] flex-1 flex-wrap items-start gap-8 px-4 sm:px-8 pb-[72px] pt-4">
            <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-7">
                <div className="flex flex-col gap-2">
                    <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
                    <p className="m-0 text-base text-ink-3">
                        <strong className="font-semibold text-ink">{t('todoCount', { count: todo.length })}</strong> ·{' '}
                        {t('sentMonth', { count: sentThisMonth(items, now) })}
                    </p>
                </div>

                <section aria-labelledby="apps-todo" className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-violet" />
                        <h2 id="apps-todo" className="m-0 text-xl font-extrabold">
                            {t('todo')}
                        </h2>
                    </div>
                    {todo.length === 0 ? (
                        <div className="rounded-[18px] border-[1.5px] border-dashed border-line-strong p-[22px] text-center text-[15px] text-ink-3">
                            {t('upToDate')}
                        </div>
                    ) : null}
                    {todo.map((a, i) => (
                        <article key={a.id} className={cn(card, i === 0 && 'border-[1.5px] border-ink shadow-card')}>
                            <Head a={a} meta={meta(a)}>
                                {a.status === 'failed' ? <Badge tone="bad">{t('badgeFailed')}</Badge> : <Badge tone="warn">{t('badgeFollowUp')}</Badge>}
                            </Head>
                            {a.status === 'failed' ? (
                                <>
                                    <p className="m-0 text-[14.5px] leading-[1.6] text-ink-2">{t('failedText')}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ButtonLink href={`/jobs/${a.job_id}/apply`} size="sm" className="h-10 px-4 text-sm">
                                            {t('resend')}
                                        </ButtonLink>
                                        <ButtonLink href="/settings/gmail" variant="secondary" size="sm" className="h-10 px-3.5 text-sm">
                                            {t('gmailSettings')}
                                        </ButtonLink>
                                        <Button
                                            variant="link"
                                            className="px-2 text-sm font-semibold text-ink-3 hover:text-ink"
                                            disabled={busy}
                                            onClick={() => set(a, 'withdrawn')}
                                        >
                                            {t('notInterested')}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="m-0 text-[14.5px] leading-[1.6] text-ink-2">{t('followUpText')}</p>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        {answers(a)}
                                        {letterLink(a)}
                                    </div>
                                </>
                            )}
                        </article>
                    ))}
                </section>

                <section aria-labelledby="apps-waiting" className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-[#C9CDD5]" />
                        <h2 id="apps-waiting" className="m-0 text-xl font-extrabold">
                            {t('waiting')}
                        </h2>
                    </div>
                    {waiting.length === 0 ? <span className="text-sm text-ink-3">{t('noneWaiting')}</span> : null}
                    {waiting.map((a) => {
                        const opened = a.email ? opens[a.email.id] : undefined
                        const at = a.email?.scheduled_at ? new Date(a.email.scheduled_at) : null
                        return (
                            <article key={a.id} className={card}>
                                <Head a={a} meta={meta(a)}>
                                    {letterLink(a)}
                                </Head>
                                {a.status === 'scheduled' ? (
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        {at ? (
                                            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#EEEAFE] px-2.5 text-[13px] font-semibold text-violet-hover">
                                                <Icon name="clock" size={14} />
                                                {t('leaves', {
                                                    date: format.dateTime(at, { weekday: 'long', day: 'numeric', month: 'long' }),
                                                    time: format.dateTime(at, { hour: 'numeric', minute: '2-digit' }),
                                                })}
                                            </span>
                                        ) : null}
                                        <button
                                            type="button"
                                            disabled={busy}
                                            className={buttonClass('secondary', 'sm', small)}
                                            onClick={() =>
                                                sendNow.mutate(a.id, {
                                                    onSuccess: () => toast(t('sentNow', { company: a.company })),
                                                    onError: (e) => {
                                                        const status = isAxiosError(e) ? e.response?.status : undefined
                                                        const message = isAxiosError(e)
                                                            ? ((e.response?.data as { error?: string } | undefined)?.error ?? '')
                                                            : ''
                                                        toast(applyError(status, message) === 'gmail' ? t('needGmail') : tc('error'))
                                                    },
                                                })
                                            }
                                        >
                                            {t('sendNow')}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            className={cn(small, 'cursor-pointer border-0 bg-transparent font-semibold text-[#B42318] disabled:opacity-50')}
                                            onClick={() => set(a, 'withdrawn', t('cancelled'))}
                                        >
                                            {t('cancel')}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2.5">
                                            <Step on>{t('stepSent')}</Step>
                                            <Rail on={!!opened} />
                                            {a.via === 'gmail' && opened ? (
                                                <>
                                                    <Step on lit>
                                                        {t('stepOpened', { date: format.relativeTime(new Date(opened), now) })}
                                                    </Step>
                                                    <Rail on={false} />
                                                </>
                                            ) : null}
                                            <Step on={false}>{t('stepReply')}</Step>
                                        </div>
                                        {a.via === 'self' ? (
                                            <span className="text-[13px] text-ink-3">{t('selfNote', { date: day(followUpOn(a)) })}</span>
                                        ) : null}
                                        <div className="flex flex-wrap gap-4 text-[13.5px]">
                                            <button
                                                type="button"
                                                className={cn(textBtn, 'text-[13.5px] font-semibold')}
                                                disabled={busy}
                                                onClick={() => set(a, 'replied')}
                                            >
                                                {t('theyReplied')}
                                            </button>
                                            <button
                                                type="button"
                                                className={cn(textBtn, 'text-[13.5px] font-semibold text-ink-3 hover:text-ink')}
                                                disabled={busy}
                                                onClick={() => set(a, 'withdrawn')}
                                            >
                                                {t('notInterested')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </article>
                        )
                    })}
                </section>

                <section aria-labelledby="apps-done" className="flex flex-col gap-2.5">
                    <h2 id="apps-done" className="m-0 font-sans text-base font-semibold tracking-normal text-ink-3">
                        {t('done', { count: done.length })}
                    </h2>
                    {done.length === 0 ? <span className="text-sm text-ink-3">{t('doneEmpty')}</span> : null}
                    {done.map((a) => {
                        // A scheduled application cancelled before its time never left: it can only be sent again.
                        const neverLeft = a.status === 'withdrawn' && a.via === 'gmail' && a.email?.status !== 'sent'
                        return (
                            <article key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line-soft bg-white px-4 py-3">
                                <CompanyBadge company={a.company || '?'} size={36} className="rounded-[10px]" />
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <Link href={`/jobs/${a.job_id}`} className="truncate text-[15px] font-semibold text-ink no-underline hover:text-violet">
                                        {a.job_title || t('offer')}
                                    </Link>
                                    <span className="text-[13px] text-ink-3">{a.company}</span>
                                </span>
                                <Badge tone={a.status === 'replied' ? 'ok' : 'mute'}>
                                    {t(
                                        a.status === 'replied'
                                            ? 'statusReplied'
                                            : a.status === 'closed'
                                              ? 'statusClosed'
                                              : neverLeft
                                                ? 'statusCancelled'
                                                : 'statusWithdrawn',
                                    )}
                                </Badge>
                                {a.status === 'replied' ? (
                                    <button
                                        type="button"
                                        className={cn(textBtn, 'text-[13.5px] text-ink-3 hover:text-ink')}
                                        disabled={busy}
                                        onClick={() => set(a, 'closed')}
                                    >
                                        {t('saidNo')}
                                    </button>
                                ) : null}
                                {neverLeft ? (
                                    <Link href={`/jobs/${a.job_id}/apply`} className="text-[13.5px] font-medium no-underline">
                                        {t('resend')}
                                    </Link>
                                ) : (
                                    <button type="button" className={cn(textBtn, 'text-[13.5px]')} disabled={busy} onClick={() => set(a, 'sent')}>
                                        {t('backToWaiting')}
                                    </button>
                                )}
                            </article>
                        )
                    })}
                </section>
            </div>

            <aside className="sticky top-[92px] flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
                <div className="flex flex-col gap-3.5 rounded-[18px] bg-ink p-[22px] text-white">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-[#B8BCC6]">{t('continue')}</span>
                    <strong className="font-display text-2xl font-extrabold leading-[1.15]">{t('moreOffers', { count: counts.data?.for_you ?? 0 })}</strong>
                    <span className="text-sm leading-[1.55] text-[#C8CBD3]">{t('moreText')}</span>
                    <Link
                        href="/jobs?tab=for_you"
                        className="flex h-[46px] items-center justify-center rounded-xl bg-lime text-[15px] font-bold text-ink no-underline hover:text-ink"
                    >
                        {t('seeOffers')}
                    </Link>
                </div>
                <div className="flex flex-col gap-2.5 rounded-[18px] border border-line-soft bg-white p-[18px]">
                    <strong className="text-[15px] font-semibold">{t('howTitle')}</strong>
                    <ul className="m-0 flex list-disc flex-col gap-1.5 ps-[18px] text-[13.5px] leading-[1.5] text-ink-2">
                        {(['howScheduled', 'howOpened', 'howReply', 'howFollowUp'] as const).map((k) => (
                            <li key={k}>{t.rich(k, { b: (c) => <strong>{c}</strong> })}</li>
                        ))}
                    </ul>
                </div>
            </aside>

            {letter ? <LetterModal a={letter} onClose={() => setLetter(null)} /> : null}
        </main>
    )
}
