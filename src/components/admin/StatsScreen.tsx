'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { dinars } from '@/components/billing/billing'
import { Segmented } from '@/components/ui/Segmented'
import { useAdminStats } from '@/hooks/useAdminStats'
import { cn } from '@/lib/cn'
import { Kpi } from './SourcesScreen'
import { rangeOf, rate, share, total, weekly, type Period } from './stats'

const card = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-5'

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
    return (
        <div className="grid grid-cols-[minmax(120px,1fr)_2fr_auto] items-center gap-4 text-[14.5px]">
            <span>{label}</span>
            <span aria-hidden className="h-6 overflow-hidden rounded-lg bg-fill">
                <span className={cn('block h-full rounded-lg', tone)} style={{ width: `${share(value, max)}%` }} />
            </span>
            <strong className="min-w-[56px] text-end tabular-nums">{value}</strong>
        </div>
    )
}

// StatsScreen is « Statistiques »: what statistics-api counted from the events of the other services.
export default function StatsScreen() {
    const t = useTranslations('admin')
    const locale = useLocale()
    const [period, setPeriod] = useState<Period>('30')
    const { data, isLoading, isError, isPlaceholderData } = useAdminStats(rangeOf(period))

    const signups = total(data, 'user_registered')
    const sent = total(data, 'email_sent')
    const opened = total(data, 'email_opened')
    const failed = total(data, 'email_failed')
    const payments = total(data, 'payment_completed')
    const revenue = total(data, 'revenue_millimes') / 1000
    const openRate = rate(opened, sent)
    const weeks = weekly([data?.metrics?.user_registered?.series, data?.metrics?.payment_completed?.series])
    const tallest = Math.max(1, ...weeks.flatMap((w) => w.values))
    const figure = (n: number) => (data ? n : undefined)
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('statsTitle')}</h1>
                    <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('statsSubtitle')}</p>
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
            {isError ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('statsError')}
                </p>
            ) : null}
            <div aria-busy={isLoading || isPlaceholderData} className={cn('flex flex-col gap-6', isPlaceholderData && 'opacity-60')}>
                <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
                    <Kpi label={t('kSignups')} value={figure(signups)} sub={t('kSignupsSub')} />
                    <Kpi label={t('kSent')} value={figure(sent)} sub={t('kSentSub')} />
                    <Kpi label={t('kOpened')} value={figure(opened)} sub={openRate === null ? t('kOpenedNone') : t('kOpenedSub', { rate: openRate })} />
                    <Kpi label={t('kPayments')} value={figure(payments)} sub={t('kPaymentsSub')} />
                    <Kpi label={t('kRevenue')} value={data ? t('revenueDt', { amount: dinars(revenue, locale) }) : undefined} sub={t('kRevenueSub')} />
                </div>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <section aria-labelledby="mails-h" className={cn(card, 'border-[1.5px] border-ink shadow-card')}>
                        <h2 id="mails-h" className="m-0 text-xl font-extrabold">
                            {t('mailsTitle')}
                        </h2>
                        <Bar label={t('mSent')} value={sent} max={sent} tone="bg-ink" />
                        <Bar label={t('mOpened')} value={opened} max={sent} tone="bg-violet" />
                        <Bar label={t('mFailed')} value={failed} max={sent} tone="bg-[#F04438]" />
                        <p className="m-0 text-[13px] text-ink-3">{openRate === null ? t('mailsNone') : t('mailsNote', { rate: openRate })}</p>
                    </section>
                    <section aria-labelledby="weeks-h" className={card}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 id="weeks-h" className="m-0 text-xl font-extrabold">
                                {t('weeksTitle')}
                            </h2>
                            <span className="flex items-center gap-4 text-[13.5px] text-ink-2">
                                <span className="flex items-center gap-1.5">
                                    <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-violet-soft" />
                                    {t('kSignups')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-ink" />
                                    {t('kPayments')}
                                </span>
                            </span>
                        </div>
                        {weeks.length === 0 ? <p className="m-0 text-sm text-ink-3">{isLoading ? '' : t('weeksNone')}</p> : null}
                        <ul className="m-0 flex h-[220px] list-none items-end gap-4 p-0">
                            {weeks.map((w) => (
                                <li key={w.monday} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5 text-center">
                                    <span className="sr-only">{t('weekLine', { week: w.week, signups: w.values[0], payments: w.values[1] })}</span>
                                    <span aria-hidden className="text-[13px] font-semibold tabular-nums">
                                        {w.values[0]}
                                    </span>
                                    <span aria-hidden className="flex min-h-0 flex-1 items-end gap-1">
                                        <span className="flex-1 rounded-t-md bg-violet-soft" style={{ height: `${share(w.values[0], tallest)}%` }} />
                                        <span className="flex-1 rounded-t-md bg-ink" style={{ height: `${share(w.values[1], tallest)}%` }} />
                                    </span>
                                    <span aria-hidden className="text-[13px] text-ink-3">
                                        {t('weekShort', { week: w.week })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    )
}
