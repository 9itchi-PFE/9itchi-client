'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Segmented } from '@/components/ui/Segmented'
import { useAdminBooks } from '@/hooks/useAdminBooks'
import { useReviewList } from '@/hooks/useAdminJobs'
import { useAdminStats } from '@/hooks/useAdminStats'
import { useConversations } from '@/hooks/useChat'
import { cn } from '@/lib/cn'
import { dinars } from '@/components/billing/billing'
import { Kpi } from './SourcesScreen'
import { before, type Period, rangeOf, rate, share, total } from './stats'

const card = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-5'

// Todo is one line of « À faire aujourd'hui »: how many, what, and where it is done. Nothing to do: the line
// stays, greyed, so the team sees it was looked at.
function Todo({ count, title, text, href }: { count: number | undefined; title: string; text: string; href: string }) {
    const none = count === 0
    return (
        <li className="border-t border-fill first:border-t-0">
            <Link href={href} className="flex items-center gap-3.5 py-3.5 text-ink no-underline hover:text-violet">
                <span
                    className={cn(
                        'grid h-10 w-10 flex-none place-items-center rounded-xl text-[17px] font-bold tabular-nums',
                        none ? 'bg-fill-3 text-ink-3' : 'bg-violet-soft text-violet-hover',
                    )}
                >
                    {count ?? '–'}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="text-[15.5px] font-semibold">{title}</strong>
                    <span className="text-[13.5px] text-ink-3">{text}</span>
                </span>
                <span aria-hidden className="text-ink-3 rtl:rotate-180">
                    →
                </span>
            </Link>
        </li>
    )
}

// OverviewScreen is where the team starts: the figures of the period against the one before, how many of the
// new students paid, and what waits for someone today.
export default function OverviewScreen() {
    const t = useTranslations('admin')
    const locale = useLocale()
    const [period, setPeriod] = useState<Period>('7')
    const range = rangeOf(period)
    const now = useAdminStats(range)
    const past = useAdminStats(before(range))
    const pending = useReviewList('pending').data?.counts
    const books = useAdminBooks()
    const inbox = useConversations()

    const data = now.data
    const signups = total(data, 'user_registered')
    const payments = total(data, 'payment_completed')
    const sent = total(data, 'email_sent')
    const opened = total(data, 'email_opened')
    const revenue = total(data, 'revenue_millimes') / 1000
    const more = signups - total(past.data, 'user_registered')
    const paid = rate(payments, signups)
    const openRate = rate(opened, sent)
    const figure = (n: number) => (data ? n : undefined)
    const drafts = books.data?.filter((b) => b.status === 'draft' || b.status === 'failed').length
    const open = inbox.data?.items.filter((c) => !c.resolved_at).length
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('overviewTitle')}</h1>
                    <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('overviewSubtitle')}</p>
                </div>
                <Segmented
                    label={t('statsPeriod')}
                    value={period}
                    onChange={setPeriod}
                    itemClassName="px-4 h-10 text-[15px]"
                    options={[
                        { value: '7', label: t('period7') },
                        { value: '30', label: t('period30') },
                        { value: '365', label: t('period365') },
                    ]}
                />
            </div>
            {now.isError ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('statsError')}
                </p>
            ) : null}
            <div
                aria-busy={now.isLoading || now.isPlaceholderData}
                className={cn('grid grid-cols-2 gap-3.5 lg:grid-cols-4', now.isPlaceholderData && 'opacity-60')}
            >
                <Kpi
                    label={t('oNew')}
                    value={figure(signups)}
                    sub={!data || !past.data ? t('kSignupsSub') : more === 0 ? t('oSame') : t(more > 0 ? 'oMore' : 'oLess', { count: Math.abs(more) })}
                />
                <Kpi label={t('kPayments')} value={figure(payments)} sub={paid === null ? t('kPaymentsSub') : t('oPaidRate', { rate: paid })} />
                <Kpi label={t('kRevenue')} value={data ? t('revenueDt', { amount: dinars(revenue, locale) }) : undefined} sub={t('kRevenueSub')} />
                <Kpi label={t('kSent')} value={figure(sent)} sub={openRate === null ? t('kOpenedNone') : t('oOpened', { rate: openRate })} />
            </div>
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.7fr_1fr]">
                <section aria-labelledby="funnel-h" className={card}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 id="funnel-h" className="m-0 text-xl font-extrabold">
                            {t('funnelTitle')}
                        </h2>
                        <Link href="/admin/stats" className="text-sm font-medium underline">
                            {t('funnelMore')}
                        </Link>
                    </div>
                    {[
                        { label: t('fSignups'), value: signups, tone: 'bg-ink' },
                        { label: t('fPaid'), value: payments, tone: 'bg-lime-deep' },
                    ].map((row) => (
                        <div key={row.label} className="flex flex-col gap-1.5">
                            <div className="flex items-baseline justify-between gap-3 text-[15px]">
                                <span>{row.label}</span>
                                <span className="tabular-nums">
                                    <strong>{data ? row.value : '–'}</strong>
                                    {rate(row.value, signups) !== null ? <span className="text-ink-3"> · {rate(row.value, signups)} %</span> : null}
                                </span>
                            </div>
                            <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-fill">
                                <span
                                    className={cn('block h-full rounded-full', row.tone)}
                                    style={{ width: `${share(row.value, Math.max(signups, payments))}%` }}
                                />
                            </span>
                        </div>
                    ))}
                    <p className="m-0 text-[13.5px] leading-[1.55] text-ink-3">{t('funnelNote')}</p>
                </section>
                <section aria-labelledby="todo-h" className={cn(card, 'gap-1 border-[1.5px] border-ink shadow-card')}>
                    <h2 id="todo-h" className="m-0 text-xl font-extrabold">
                        {t('todoTitle')}
                    </h2>
                    <ul className="m-0 flex list-none flex-col p-0">
                        <Todo count={pending?.pending} title={t('todoReview')} text={t('todoReviewText')} href="/admin/jobs" />
                        <Todo count={open} title={t('todoSupport')} text={t('todoSupportText')} href="/admin/support" />
                        <Todo count={drafts} title={t('todoBooks')} text={t('todoBooksText')} href="/admin/books" />
                        <Todo count={pending?.expired} title={t('todoExpired')} text={t('todoExpiredText')} href="/admin/jobs" />
                    </ul>
                </section>
            </div>
        </div>
    )
}
