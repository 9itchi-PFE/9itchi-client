'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useProspectStats } from '@/hooks/useProspectStats'
import { cn } from '@/lib/cn'
import type { ProspectDay, ProspectSource, ProspectStats } from '@/types/prospects'
import type { Integration } from '@/types/statistics'
import { forecast, ownSpend, type Balance, type Forecast } from './forecast'
import { Kpi } from './SourcesScreen'

const card = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-5'
const SOURCES: ProspectSource[] = ['website', 'hunter', 'apollo', 'quickenrich', 'offer', 'import']
// Two series checked with the dataviz validator on white: violet = served from the pool, orange = found by the search.
const POOL = 'bg-violet'
const FOUND = 'bg-[#E8703A]'
// Forecast verdicts: green while the credits last, red when they run out before the renewal.
const OK = '#067647'
const OUT = '#F04438'

const DAY = 86_400_000

// PoolSection is « Base de contacts » on Crédits: the shared contact pool of Recruiter Radar, how often a search is
// served from it (a hit spends no Hunter/Apollo credit), and per provider with a live balance whether the credits last.
export default function PoolSection({ integrations }: { integrations: Integration[] }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const { data, isError } = useProspectStats()
    const n = (v: number) => new Intl.NumberFormat(locale).format(v)
    const withBalance = integrations.filter((i): i is Integration & { balance: Balance } => !!i.balance)
    const empty = data && data.pool.contacts === 0 && data.last_30_days.searches === 0

    return (
        <section aria-labelledby="credits-pool" className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <h2 id="credits-pool" className="m-0 text-xl font-extrabold">
                    {t('poolTitle')}
                </h2>
                <p className="m-0 max-w-[760px] text-[13.5px] text-ink-3">{t('poolNote')}</p>
            </div>
            {isError ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('poolError')}
                </p>
            ) : null}
            {empty ? <p className="m-0 rounded-[14px] bg-fill px-4 py-3 text-sm text-ink-2">{t('poolEmpty')}</p> : null}
            {data && !empty ? (
                <>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                        <Kpi label={t('poolContacts')} value={n(data.pool.contacts)} sub={t('poolContactsSub', { companies: n(data.pool.companies) })} />
                        <Kpi label={t('poolVerified')} value={n(data.pool.verified)} sub={t('poolVerifiedSub', { hr: n(data.pool.hr) })} />
                        <Kpi
                            label={t('poolHit')}
                            value={`${n(data.last_30_days.pool_hit_rate)} %`}
                            sub={t('poolHitSub', { rate: n(data.last_30_days.pool_hit_rate) })}
                        />
                        <Kpi
                            label={t('poolOnly')}
                            value={`${n(data.last_30_days.pool_only_rate)} %`}
                            sub={t('poolOnlySub', {
                                rate: n(data.last_30_days.pool_only_rate),
                                only: n(data.last_30_days.pool_only_searches),
                                searches: n(data.last_30_days.searches),
                            })}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
                        <DailyChart daily={data.daily} />
                        <BySource stats={data} />
                    </div>
                </>
            ) : null}
            {withBalance.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {withBalance.map((i) => (
                        <ForecastCard key={i.provider} integration={i} balance={i.balance} daily={data?.daily} />
                    ))}
                </div>
            ) : null}
        </section>
    )
}

// DailyChart stacks, per UTC day, the contacts served from the pool under the ones the search had to find.
function DailyChart({ daily }: { daily: ProspectDay[] }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const [active, setActive] = useState<number | null>(null)
    const n = (v: number) => new Intl.NumberFormat(locale).format(v)
    const short = (d: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`))
    const tallest = Math.max(1, ...daily.map((d) => d.contacts_from_pool + d.contacts_found))
    const shown = active === null ? null : daily[active]
    const line = (d: ProspectDay) => t('poolDayLine', { day: short(d.day), pool: n(d.contacts_from_pool), found: n(d.contacts_found), searches: n(d.searches) })

    return (
        <article aria-labelledby="pool-daily" className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id="pool-daily" className="m-0 text-lg font-extrabold">
                    {t('poolDaily')}
                </h3>
                <span className="flex flex-wrap items-center gap-4 text-[13.5px] text-ink-2">
                    <span className="flex items-center gap-1.5">
                        <span aria-hidden className={cn('h-2.5 w-2.5 rounded-[3px]', POOL)} />
                        {t('poolFromPool')}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span aria-hidden className={cn('h-2.5 w-2.5 rounded-[3px]', FOUND)} />
                        {t('poolFound')}
                    </span>
                </span>
            </div>
            <p aria-live="polite" className="m-0 min-h-[20px] text-[13.5px] tabular-nums text-ink-2">
                {shown ? line(shown) : t('poolDailyHint', { max: n(tallest) })}
            </p>
            <div dir="ltr" className="flex flex-col gap-1.5">
                <ul className="m-0 flex h-[140px] list-none items-end gap-[2px] border-b border-line p-0" onMouseLeave={() => setActive(null)}>
                    {daily.map((d, idx) => {
                        const total = d.contacts_from_pool + d.contacts_found
                        return (
                            <li
                                key={d.day}
                                onMouseEnter={() => setActive(idx)}
                                className={cn('flex h-full min-w-0 flex-1 flex-col items-center justify-end', active === idx && 'bg-fill-3')}
                            >
                                <span className="sr-only">{line(d)}</span>
                                <span
                                    aria-hidden
                                    className="flex w-full max-w-[24px] flex-col justify-end gap-[2px]"
                                    style={{ height: `${(total / tallest) * 100}%` }}
                                >
                                    {d.contacts_found > 0 ? (
                                        <span className={cn('min-h-[2px] rounded-t-[4px]', FOUND)} style={{ flexGrow: d.contacts_found }} />
                                    ) : null}
                                    {d.contacts_from_pool > 0 ? (
                                        <span
                                            className={cn('min-h-[2px]', POOL, d.contacts_found === 0 && 'rounded-t-[4px]')}
                                            style={{ flexGrow: d.contacts_from_pool }}
                                        />
                                    ) : null}
                                </span>
                            </li>
                        )
                    })}
                </ul>
                {daily.length > 0 ? (
                    <div aria-hidden className="flex justify-between text-[11px] text-ink-3">
                        <span>{short(daily[0].day)}</span>
                        <span>{short(daily[daily.length - 1].day)}</span>
                    </div>
                ) : null}
            </div>
        </article>
    )
}

// BySource is where the pool contacts came from, every source listed (0 included).
function BySource({ stats }: { stats: ProspectStats }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const n = (v: number) => new Intl.NumberFormat(locale).format(v)
    const most = Math.max(1, ...SOURCES.map((s) => stats.pool.by_source[s] ?? 0))
    return (
        <article aria-labelledby="pool-sources" className={card}>
            <h3 id="pool-sources" className="m-0 text-lg font-extrabold">
                {t('poolBySource')}
            </h3>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {SOURCES.map((s) => {
                    const v = stats.pool.by_source[s] ?? 0
                    return (
                        <li key={s} className="flex flex-col gap-1">
                            <span className="flex items-baseline justify-between gap-2 text-[13.5px]">
                                <span className="text-ink-2">{t(`source_${s}`)}</span>
                                <strong className="tabular-nums">{n(v)}</strong>
                            </span>
                            <span aria-hidden className="h-2 rounded-full bg-fill">
                                <span className="block h-full rounded-full bg-violet" style={{ width: `${(v / most) * 100}%` }} />
                            </span>
                        </li>
                    )
                })}
            </ul>
            <p className="m-0 text-[13px] text-ink-3">{t('poolFresh', { fresh: n(stats.pool.fresh) })}</p>
        </article>
    )
}

// ForecastCard draws the provider's credits left over the cycle: what was used (solid) and the same pace to the
// renewal (dashed). The balance counts every use of the key; the 9itchi part comes from the daily credits.
function ForecastCard({ integration, balance, daily }: { integration: Integration; balance: Balance; daily?: ProspectDay[] }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const f = forecast(balance)
    if (!f) return null
    const n = (v: number) => new Intl.NumberFormat(locale).format(Math.round(v))
    const date = (ms: number, style: 'medium' | 'short' = 'medium') =>
        new Intl.DateTimeFormat(
            locale,
            style === 'medium' ? { dateStyle: 'medium', timeZone: 'UTC' } : { day: 'numeric', month: 'short', timeZone: 'UTC' },
        ).format(new Date(ms))
    const color = f.runsOut === null ? OK : OUT
    const own = daily ? ownSpend(daily, integration.provider, f.start) : null

    return (
        <article aria-labelledby={`forecast-${integration.provider}`} className={card}>
            <div className="flex flex-col gap-0.5">
                <h3 id={`forecast-${integration.provider}`} className="m-0 text-lg font-extrabold">
                    {t('forecastTitle', { name: integration.label })}
                </h3>
                <span className="text-[13.5px] text-ink-3">{t('forecastCycle', { start: date(f.start), end: date(f.end) })}</span>
            </div>
            <p className="m-0 flex items-start gap-2 text-[14.5px] font-semibold">
                <span aria-hidden className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                {f.runsOut === null ? t('forecastOk', { date: date(f.end), n: n(f.projected) }) : t('forecastOut', { date: date(f.runsOut), k: f.daysEarly })}
            </p>
            <ForecastChart f={f} color={color} label={t('forecastChart', { name: integration.label })} date={(ms) => date(ms, 'short')} n={n} />
            <div className="flex flex-col gap-1 text-[13px] text-ink-3">
                <span>{t('forecastRate', { rate: n(f.perDay), left: n(f.left), limit: n(f.limit) })}</span>
                {own ? <span>{t(own.partial ? 'forecastOwnPartial' : 'forecastOwn', { x: n(own.credits) })}</span> : null}
            </div>
        </article>
    )
}

// ForecastChart is an inline SVG (x = cycle days, y = credits left from 0 to the limit) with HTML labels over it,
// placed in percent of the drawing so they keep their size on a phone.
function ForecastChart({ f, color, label, date, n }: { f: Forecast; color: string; label: string; date: (ms: number) => string; n: (v: number) => string }) {
    const t = useTranslations('admin')
    const W = 360
    const H = 150
    const top = 22
    const bottom = 124
    const x = (ms: number) => ((ms - f.start) / Math.max(DAY, f.end - f.start)) * W
    const y = (v: number) => bottom - (Math.max(0, v) / f.limit) * (bottom - top)
    const endAt = f.runsOut ?? f.end
    const endLeft = f.runsOut === null ? f.projected : 0
    const pct = (v: number, of: number) => `${(v / of) * 100}%`
    const nowX = x(f.now)
    const todayLabel = nowX > W * 0.18 && nowX < W * 0.82

    return (
        <figure className="m-0 flex flex-col gap-2">
            <div dir="ltr" className="relative w-full">
                <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={label}>
                    <line x1={0} x2={W} y1={top} y2={top} stroke="#E4E7EC" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    <line x1={0} x2={W} y1={bottom} y2={bottom} stroke="#98A2B3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    <line x1={nowX} x2={nowX} y1={top} y2={bottom} stroke="#DADDE3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    <line
                        x1={0}
                        y1={y(f.limit)}
                        x2={nowX}
                        y2={y(f.left)}
                        stroke={color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    <line
                        x1={nowX}
                        y1={y(f.left)}
                        x2={x(endAt)}
                        y2={y(endLeft)}
                        stroke={color}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={nowX} cy={y(f.left)} r={4} fill={color} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                    <circle cx={x(endAt)} cy={y(endLeft)} r={4} fill="#fff" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                </svg>
                <span aria-hidden className="absolute start-0 -translate-y-full text-[11px] tabular-nums text-ink-3" style={{ top: pct(top, H) }}>
                    {n(f.limit)}
                </span>
                <span aria-hidden className="absolute start-0 -translate-y-full text-[11px] tabular-nums text-ink-3" style={{ top: pct(bottom, H) }}>
                    0
                </span>
                <span aria-hidden className="absolute start-0 text-[11px] text-ink-3" style={{ top: pct(bottom + 4, H) }}>
                    {date(f.start)}
                </span>
                {todayLabel ? (
                    <span
                        aria-hidden
                        className="absolute -translate-x-1/2 text-[11px] font-semibold text-ink-2"
                        style={{ top: pct(bottom + 4, H), left: pct(nowX, W) }}
                    >
                        {t('forecastToday')}
                    </span>
                ) : null}
                <span aria-hidden className="absolute end-0 -translate-y-full text-[11px] font-semibold text-ink-2" style={{ top: pct(top, H) }}>
                    {t('forecastRenewal', { date: date(f.end) })}
                </span>
                <span aria-hidden className="absolute end-0 text-[11px] text-ink-3" style={{ top: pct(bottom + 4, H) }}>
                    {date(f.end)}
                </span>
            </div>
            <figcaption className="flex flex-wrap items-center gap-4 text-[13px] text-ink-2">
                <span className="flex items-center gap-1.5">
                    <svg aria-hidden width="18" height="4">
                        <line x1="1" x2="17" y1="2" y2="2" stroke={color} strokeWidth={2} strokeLinecap="round" />
                    </svg>
                    {t('forecastUsed', { left: n(f.left) })}
                </span>
                <span className="flex items-center gap-1.5">
                    <svg aria-hidden width="18" height="4">
                        <line x1="1" x2="17" y1="2" y2="2" stroke={color} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
                    </svg>
                    {t('forecastProjection')}
                </span>
            </figcaption>
        </figure>
    )
}
