'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useQueries } from '@tanstack/react-query'
import { Icon } from '@/components/ui/icons'
import { useScores } from '@/hooks/useApplications'
import { jobKeys, useBooks, useJob, useJobCounts, useJobList, useToggleSave } from '@/hooks/useJobs'
import { useMyCv } from '@/hooks/useResumes'
import { cn } from '@/lib/cn'
import JobService from '@/services/JobService'
import type { Tab } from '@/types/job'
import BooksBand from './BooksBand'
import MoreFilters from './MoreFilters'
import OfferCard from './OfferCard'
import OfferDetail from './OfferDetail'
import { EmptyForYou, EmptySaved, EmptySearch, OffersSkeleton, Sk } from './OfferStates'
import { defaultFilters, filtered, fromSearch, relaxations, searching, toJobQuery, toSearch, type Filters } from './filters'

const PAGE = 20
const TABS: Tab[] = ['for_you', 'all', 'saved']
const QUICK = [
    ['paid', 'paid'],
    ['flexible', 'flexible'],
    ['easy', 'easy'],
    ['pair', 'pair'],
] as const

// OffersScreen is screen 2.1 « Trouve ton PFE »: search, quick filters, tabs, the offers that fit the CV best first,
// the PFE books band, and the selected offer in a side panel. Every filter lives in the URL.
export default function OffersScreen() {
    const t = useTranslations('offers')
    const tc = useTranslations('common')
    const tt = useTranslations('prefs.topics')
    const tm = useTranslations('prefs.modes')
    const ts = useTranslations('offers.scores')
    const format = useFormatter()
    const locale = useLocale()
    const router = useRouter()
    const params = useSearchParams()
    const filters = useMemo(() => fromSearch(params), [params])
    const key = toSearch(filters)
    const href = (f: Filters) => `/jobs${toSearch(f)}`
    const go = (f: Filters) => router.replace(href(f), { scroll: false })

    const cv = useMyCv()
    const [shown, setShown] = useState({ key, pages: 1 })
    const pages = shown.key === key ? shown.pages : 1
    const query = { ...toJobQuery(filters, cv.skills), page: 1, page_size: Math.min(PAGE * pages, 100) }
    const list = useJobList(query, cv.ready)
    const counts = useJobCounts()
    const books = useBooks()
    const save = useToggleSave()

    // Tab totals follow the search, so « Toutes · 0 » reads right on an empty search.
    const totals = useQueries({
        queries: TABS.map((tab) => {
            const q = { ...toJobQuery(filters, [], tab), sort: undefined, page_size: 1 }
            return { queryKey: jobKeys.total(q), queryFn: async () => (await JobService.listJobs(q)).data.total }
        }),
    })

    const items = list.data?.items ?? []
    const empty = list.isSuccess && !list.isPlaceholderData && items.length === 0

    // On « Pour toi » sorted by match, the AI scores the first offers once a day; the list never waits for it.
    const scoring = filters.tab === 'for_you' && cv.skills.length > 0 && list.isSuccess && !list.isPlaceholderData
    const scores = useScores(
        cv.id,
        items.slice(0, 10).map((j) => j.id),
        locale === 'en' || locale === 'ar' ? locale : 'fr',
        scoring,
    )
    const aiItems = scores.data?.items ?? {}
    const allowance = scores.data?.allowance ?? null
    const usedUp = Object.values(aiItems).some((s) => s.status === 'quota')
    const relax = relaxations(filters)
    const relaxCounts = useQueries({
        queries: relax.map((r) => {
            const q = { ...toJobQuery(r.filters, [], r.filters.tab), sort: undefined, page_size: 1 }
            return {
                queryKey: jobKeys.total(q),
                queryFn: async () => (await JobService.listJobs(q)).data.total,
                enabled: empty && filtered(filters) && filters.tab !== 'saved',
            }
        }),
    })

    // ?job= (a link to one offer) selects it, even when it is not in the list.
    const wanted = params.get('job') ?? undefined
    const [selectedId, setSelectedId] = useState(wanted)
    const linked = useJob(selectedId && !items.some((j) => j.id === selectedId) ? selectedId : undefined).data
    const selected = items.find((j) => j.id === selectedId) ?? (linked && linked.id === selectedId ? { ...linked, snippet: '' } : items[0])
    // Under 1024px the details sit below the list, out of sight: a tap on an offer brings them into view.
    const selectOffer = (id: string) => {
        setSelectedId(id)
        if (window.matchMedia('(max-width: 1023px)').matches) {
            requestAnimationFrame(() => document.getElementById('offer-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        }
    }

    const [q, setQ] = useState(filters.q)
    const [where, setWhere] = useState(filters.location)
    const [inputsFor, setInputsFor] = useState(key)
    if (inputsFor !== key) {
        // The URL changed (a chip, a tab, a relaxed filter): show its search in the inputs.
        setInputsFor(key)
        setQ(filters.q)
        setWhere(filters.location)
    }
    const [moreOpen, setMoreOpen] = useState(false)

    const more: { label: string; clear: Partial<Filters> }[] = [
        ...(filters.topic ? [{ label: tt(filters.topic), clear: { topic: undefined } }] : []),
        ...(filters.length ? [{ label: t('months', { count: filters.length }), clear: { length: undefined } }] : []),
        ...(filters.start
            ? [
                  {
                      label: t('startChip', { month: format.dateTime(new Date(`${filters.start}-01T00:00:00`), { month: 'short', year: 'numeric' }) }),
                      clear: { start: undefined },
                  },
              ]
            : []),
        ...(filters.mode ? [{ label: tm(filters.mode), clear: { mode: undefined } }] : []),
    ]

    const tabLabel = (tab: Tab, n: number | undefined) => t(tab === 'for_you' ? 'tabForYou' : tab === 'all' ? 'tabAll' : 'tabSaved', { count: n ?? '…' })
    const bookList = books.data?.items ?? []
    const showBooks = filters.tab !== 'saved' && bookList.length > 0 && !searching(filters)
    const bandAfter = Math.min(3, items.length) - 1

    return (
        <main className="mx-auto box-border flex w-full max-w-[1320px] flex-col gap-7 px-4 sm:px-8 pb-[72px] pt-5">
            <section aria-label={t('search')} className="flex flex-col gap-[18px] pt-2">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div className="flex flex-col gap-2">
                        <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
                        <p className="m-0 text-base text-ink-3">
                            {searching(filters) ? (
                                list.data ? (
                                    t.rich('statSearch', { count: list.data.total, b: (c) => <strong className="font-semibold text-ink">{c}</strong> })
                                ) : (
                                    <Sk className="inline-block h-3.5 w-[300px] align-middle" />
                                )
                            ) : counts.data ? (
                                <>
                                    {t('statOpen', { count: counts.data.open })} ·{' '}
                                    <strong className="font-semibold text-ink">{t('statForCv', { count: counts.data.for_you })}</strong> ·{' '}
                                    {t('statNew', { count: counts.data.new_today })}
                                </>
                            ) : (
                                <Sk className="inline-block h-3.5 w-[300px] align-middle" />
                            )}
                        </p>
                    </div>
                    {cv.id && cv.toFix > 0 ? (
                        <Link
                            href={`/resumes/${cv.id}/check`}
                            className="flex items-center gap-2.5 rounded-full border border-line-soft bg-white py-2 pe-3.5 ps-2.5 text-sm text-ink no-underline hover:text-ink"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warn-bg text-[13px] font-bold text-warn-fg">
                                {cv.toFix}
                            </span>
                            <span>
                                <strong className="font-semibold">{t('cvFixes', { count: cv.toFix })}</strong>{' '}
                                <span className="text-ink-3">{t('cvFixesAfter')}</span>
                            </span>
                            <span aria-hidden className="text-ink-3 rtl:rotate-180">
                                →
                            </span>
                        </Link>
                    ) : null}
                </div>

                <form
                    role="search"
                    onSubmit={(e) => {
                        e.preventDefault()
                        go({ ...filters, q, location: where })
                    }}
                    className="flex flex-wrap items-center gap-2 rounded-[18px] bg-white p-2 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.06)]"
                >
                    <label className="flex h-[52px] min-w-0 flex-[2_1_300px] items-center gap-3 px-3.5">
                        <Icon name="search" size={20} className="flex-none" />
                        <span className="sr-only">{t('what')}</span>
                        <input
                            type="search"
                            value={q}
                            maxLength={200}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-4"
                        />
                    </label>
                    <span aria-hidden className="h-7 w-px bg-line-soft" />
                    <label className="flex h-[52px] min-w-0 flex-[1_1_180px] items-center gap-2.5 px-3.5">
                        <Icon name="pin" size={18} className="flex-none text-ink-3" />
                        <span className="sr-only">{t('where')}</span>
                        <input
                            type="text"
                            value={where}
                            maxLength={200}
                            onChange={(e) => setWhere(e.target.value)}
                            placeholder={t('anywhere')}
                            className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink"
                        />
                    </label>
                    <button
                        type="submit"
                        className="h-[52px] cursor-pointer rounded-xl border-0 bg-ink px-[26px] text-[15px] font-semibold text-white hover:bg-black"
                    >
                        {t('search')}
                    </button>
                </form>

                <div role="group" aria-label={t('filters')} className="flex flex-wrap items-center gap-2">
                    {QUICK.map(([k, label]) => (
                        <button key={k} type="button" aria-pressed={filters[k]} onClick={() => go({ ...filters, [k]: !filters[k] })} className="qf">
                            {filters[k] ? <Icon name="check" size={14} strokeWidth={3} /> : null}
                            {t(label)}
                        </button>
                    ))}
                    {more.map((m) => (
                        <button
                            key={m.label}
                            type="button"
                            aria-pressed
                            aria-label={t('removeFilter', { name: m.label })}
                            onClick={() => go({ ...filters, ...m.clear })}
                            className="qf"
                        >
                            <Icon name="check" size={14} strokeWidth={3} />
                            {m.label}
                        </button>
                    ))}
                    <button type="button" onClick={() => setMoreOpen(true)} className="qf">
                        <Icon name="filter" size={16} />
                        {t('more')}
                    </button>
                </div>
            </section>

            {!cv.ready || (list.isPending && !list.data) ? (
                <OffersSkeleton />
            ) : list.isError ? (
                <p role="alert" className="m-0 rounded-2xl bg-white p-8 text-center text-ink-3">
                    {tc('error')}{' '}
                    <button type="button" className="hit cursor-pointer border-0 bg-transparent p-0 font-semibold text-violet" onClick={() => list.refetch()}>
                        {tc('retry')}
                    </button>
                </p>
            ) : (
                <div className="flex flex-wrap items-start gap-7">
                    <section id="offers-list" aria-label={t('tabs')} className="flex min-w-0 scroll-mt-[84px] flex-[999_1_540px] flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div role="tablist" aria-label={t('tabs')} className="flex gap-1 rounded-xl bg-[#EFF0F2] p-1">
                                {TABS.map((tab, i) => {
                                    const on = tab === filters.tab
                                    return (
                                        <button
                                            key={tab}
                                            type="button"
                                            role="tab"
                                            aria-selected={on}
                                            onClick={() => go({ ...filters, tab })}
                                            className={cn(
                                                'h-9 cursor-pointer rounded-[9px] border-0 px-3.5 text-sm font-semibold',
                                                on ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,.1)]' : 'bg-transparent text-ink-3',
                                            )}
                                        >
                                            {tabLabel(tab, on && list.data ? list.data.total : totals[i].data)}
                                        </button>
                                    )
                                })}
                            </div>
                            {items.length ? <span className="text-sm text-ink-3">{cv.skills.length ? t('sortMatch') : t('sortNewest')}</span> : null}
                        </div>
                        {scoring && (scores.isFetching || allowance || usedUp) ? (
                            <p aria-live="polite" className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
                                {scores.isFetching && !scores.data ? (
                                    ts('reading')
                                ) : (
                                    <>
                                        {allowance
                                            ? allowance.limit == null
                                                ? ts('todayNoLimit', { used: allowance.used })
                                                : ts('today', { used: allowance.used, limit: allowance.limit })
                                            : null}
                                        {usedUp ? (
                                            <span className="inline-flex items-center gap-1">
                                                <Icon name="lock" size={12} />
                                                {ts('usedUp')}{' '}
                                                <Link href="/settings/billing" className="hit font-semibold text-ink underline">
                                                    {t('ai.seePlans')}
                                                </Link>
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </p>
                        ) : null}

                        {items.map((job, i) => (
                            <Fragment key={job.id}>
                                <OfferCard
                                    job={job}
                                    cvSkills={cv.skills}
                                    ai={aiItems[job.id]}
                                    selected={job.id === selected?.id}
                                    onSelect={() => selectOffer(job.id)}
                                    onToggleSave={() => save.mutate({ id: job.id, saved: !job.saved })}
                                />
                                {showBooks && i === bandAfter ? <BooksBand books={bookList} total={books.data?.total ?? bookList.length} /> : null}
                            </Fragment>
                        ))}

                        {empty ? (
                            filters.tab === 'saved' ? (
                                <EmptySaved forYouHref={href({ ...defaultFilters })} />
                            ) : filtered(filters) ? (
                                <EmptySearch
                                    query={filters.q.trim()}
                                    relax={relax
                                        .map((r, i) => ({ label: t(r.key), count: relaxCounts[i].data ?? 0, href: href(r.filters) }))
                                        .filter((r) => r.count > 0)
                                        .slice(0, 3)}
                                />
                            ) : filters.tab === 'for_you' ? (
                                <EmptyForYou allHref={href({ ...filters, tab: 'all' })} />
                            ) : null
                        ) : null}

                        {list.data && list.data.total > items.length && items.length < 100 ? (
                            <button
                                type="button"
                                onClick={() => setShown({ key, pages: pages + 1 })}
                                disabled={list.isFetching}
                                className="h-11 cursor-pointer self-center rounded-xl border border-line-strong bg-white px-5 text-[14.5px] font-semibold text-ink disabled:opacity-60"
                            >
                                {t('showMore')}
                            </button>
                        ) : null}
                    </section>
                    {selected ? <OfferDetail summary={selected} cvSkills={cv.skills} hasCv={!!cv.id} resumeId={cv.id} ai={aiItems[selected.id]} /> : null}
                </div>
            )}

            <MoreFilters open={moreOpen} filters={filters} onClose={() => setMoreOpen(false)} onApply={go} />
        </main>
    )
}
