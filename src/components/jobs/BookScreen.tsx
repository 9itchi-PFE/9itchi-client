'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { Bolt, Icon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { useBookPdf } from '@/hooks/useAdminBooks'
import { useBook } from '@/hooks/useJobs'
import { useMyCv } from '@/hooks/useResumes'
import { cn } from '@/lib/cn'
import type { Book, JobSummary } from '@/types/job'
import { TOPICS, type Topic } from '@/types/preferences'
import { Sk } from './OfferStates'
import { bookFacts } from './bookFacts'
import { megabytes, pdfState, type PdfState } from './bookPdf'
import { daysLeft, match } from './offer'

const SHOWN = 5
const label = 'font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3'
const paperNote = 'm-0 flex aspect-[210/297] w-full max-w-[360px] flex-col items-center justify-center gap-3 bg-white p-6 text-center text-sm text-ink-3'
const btn2 =
    'inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-line-strong bg-white px-4 text-sm font-semibold text-ink-2 no-underline hover:text-ink-2'

// BigCover is the book drawn in the header: company in mono, « PFE 2027 » in display type.
function BigCover({ book }: { book: Book }) {
    return (
        <div
            aria-hidden
            className="box-border flex h-[148px] w-28 flex-none flex-col justify-between rounded-[6px_22px_6px_6px] border-[1.5px] border-ink bg-lime p-3.5 shadow-[4px_4px_0_#101218]"
        >
            <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[.08em]">{book.company.split(/\s+/)[0]}</span>
            <span className="font-display text-[22px] font-extrabold leading-none">
                PFE
                <br />
                {book.year}
            </span>
        </div>
    )
}

// Facts is the white strip of the header: start, length, stipend, place, closing date.
function Facts({ book }: { book: Book }) {
    const t = useTranslations('book')
    const to = useTranslations('offers')
    const tm = useTranslations('prefs.modes')
    const format = useFormatter()
    const f = bookFacts(book.jobs ?? [], book.city)
    const day = (s: string, year = true) =>
        format.dateTime(new Date(`${s}T00:00:00`), year ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' })
    const items: [string, string, boolean?][] = []
    if (f.start) items.push([t('factStart'), t('startFrom', { date: day(f.start) })])
    if (f.length)
        items.push([
            t('factLength'),
            f.length[0] === f.length[1] ? to('months', { count: f.length[0] }) : t('lengthRange', { min: f.length[0], max: f.length[1] }),
        ])
    if (f.pay)
        items.push([
            t('factPay'),
            f.pay === 'unpaid'
                ? to('unpaid')
                : f.pay[0] === f.pay[1]
                  ? to('perMonth', { amount: format.number(f.pay[0]) })
                  : t('payRange', { min: format.number(f.pay[0]), max: format.number(f.pay[1]) }),
        ])
    if (f.place || f.mode) items.push([t('factPlace'), [f.place, f.mode ? tm(f.mode).toLocaleLowerCase() : ''].filter(Boolean).join(' · ')])
    if (f.deadline)
        items.push([
            t('factDeadline'),
            f.deadline.days <= 7 ? t('deadline', { date: day(f.deadline.date, false), days: f.deadline.days }) : day(f.deadline.date),
            f.deadline.days <= 7,
        ])
    if (!items.length) return null
    return (
        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 rounded-[18px] border border-line bg-white px-[18px] py-4">
            {items.map(([k, v, urgent]) => (
                <div key={k}>
                    <dt className={label}>{k}</dt>
                    <dd className={cn('m-0 mt-1 text-[15px]', urgent ? 'font-semibold text-warn-fg' : 'font-medium')}>{v}</dd>
                </div>
            ))}
        </dl>
    )
}

// TopicCard is one topic of the book: reference, title, summary, skills against the CV, length and places, how to apply, PDF page.
function TopicCard({ job, cvSkills, selected, onSelect }: { job: JobSummary; cvSkills: string[]; selected: boolean; onSelect: () => void }) {
    const t = useTranslations('book')
    const to = useTranslations('offers')
    const m = match(job.skills, cvSkills)
    const fits = cvSkills.length && m ? m.fits : []
    const others = cvSkills.length && m ? m.others : job.skills
    const closed = !!job.closes_on && daysLeft(job.closes_on) < 0
    const meta = [job.duration_months ? to('months', { count: job.duration_months }) : '', job.places ? t('places', { count: job.places }) : '']
        .filter(Boolean)
        .join(' · ')
    return (
        <article
            className={cn(
                'flex flex-col items-stretch gap-3.5 rounded-[18px] border bg-white p-[18px] sm:flex-row sm:items-start sm:gap-[18px]',
                selected ? 'border-violet shadow-[0_0_0_3px_rgba(75,50,224,.14)]' : 'border-line',
            )}
        >
            <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-2 border-0 bg-transparent p-0 text-start">
                <span className="flex items-baseline gap-2.5">
                    {job.ref ? <span className="font-mono text-xs font-semibold text-ink-3">{job.ref}</span> : null}
                    <span className="text-base font-semibold leading-[1.35]">{job.title}</span>
                </span>
                {job.snippet ? <span className="line-clamp-2 text-sm leading-[1.55] text-ink-2">{job.snippet}</span> : null}
                <span className="flex flex-wrap items-center gap-1.5">
                    {fits.map((s) => (
                        <span key={s} className="inline-flex h-6 items-center rounded-md bg-lime px-2 text-[12.5px] font-semibold text-ink">
                            ✓ {s}
                        </span>
                    ))}
                    {others.map((s) => (
                        <span key={s} className="inline-flex h-6 items-center rounded-md bg-fill-2 px-2 text-[12.5px] font-medium text-ink-2">
                            {s}
                        </span>
                    ))}
                    {meta ? <span className="ms-1 text-[13px] text-ink-3">{meta}</span> : null}
                </span>
            </button>
            <div className="flex flex-none flex-row-reverse items-center justify-end gap-3 sm:w-[140px] sm:flex-col sm:items-stretch sm:justify-start sm:gap-1.5">
                {closed ? (
                    <span className="flex h-10 items-center justify-center rounded-lg bg-fill px-5 text-sm font-semibold text-ink-3">{t('closed')}</span>
                ) : job.easy_apply ? (
                    <Link
                        href={`/jobs/${job.id}/apply`}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-ink px-5 text-sm font-semibold text-white no-underline hover:bg-black hover:text-white"
                    >
                        <Bolt size={14} />
                        {to('apply')}
                    </Link>
                ) : (
                    <Link
                        href={`/jobs?tab=all&job=${job.id}`}
                        className="flex h-10 items-center justify-center rounded-xl border border-line-strong bg-white px-5 text-sm font-semibold text-ink no-underline hover:text-ink"
                    >
                        {t('see')}
                    </Link>
                )}
                {job.pdf_page ? <span className="text-center text-xs text-ink-3">{t('pdfPage', { page: job.pdf_page })}</span> : null}
            </div>
        </article>
    )
}

// PdfPanel shows the book's PDF at the selected topic's page, as the company published it. The PDF can take a minute to arrive, so it also has a wait and a failure state.
function PdfPanel({ book, state, loaded, onRetry, page, onPage }: { book: Book; state: PdfState; loaded: number; onRetry: () => void; page: number; onPage: (p: number) => void }) {
    const t = useTranslations('book')
    const total = book.pages ?? 0
    const arrow =
        'flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-white text-ink-2 disabled:opacity-40'
    return (
        <aside aria-label={t('pdfTitle')} className="flex min-w-0 flex-[1_1_400px] flex-col overflow-hidden rounded-[18px] border border-line-soft bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                <span className="text-sm font-semibold">{t('pdfTitle')}</span>
                {book.pdf_url && total ? (
                    <div className="flex items-center gap-1.5 text-[13px] text-ink-2">
                        <button type="button" aria-label={t('prev')} disabled={page <= 1} onClick={() => onPage(page - 1)} className={arrow}>
                            <Icon name="left" size={16} className="rtl:rotate-180" />
                        </button>
                        <span className="min-w-[86px] text-center">{t('pageOf', { page, total })}</span>
                        <button type="button" aria-label={t('next')} disabled={page >= total} onClick={() => onPage(page + 1)} className={arrow}>
                            <Icon name="right" size={16} className="rtl:rotate-180" />
                        </button>
                    </div>
                ) : null}
            </div>
            <div className="flex justify-center bg-[#EAECF0] p-[22px]">
                {state === 'ready' ? (
                    <iframe
                        key={page}
                        title={t('pdfTitle')}
                        src={`${book.pdf_url}#page=${page}&view=FitH&toolbar=0`}
                        className="aspect-[210/297] w-full max-w-[360px] border-0 bg-white shadow-[0_2px_8px_rgba(16,24,40,.12)]"
                    />
                ) : state === 'loading' ? (
                    <div role="status" className={paperNote}>
                        <span aria-hidden className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-ink" />
                        <span>{t('pdfLoading')}</span>
                        {loaded > 0 ? <span className="text-[13px]">{t('pdfLoaded', { size: megabytes(loaded) })}</span> : null}
                    </div>
                ) : state === 'error' ? (
                    <div role="alert" className={paperNote}>
                        <span>{t('pdfError')}</span>
                        <Button variant="secondary" size="sm" onClick={onRetry}>
                            {t('pdfRetry')}
                        </Button>
                    </div>
                ) : (
                    <p className={paperNote}>{t('noPdf')}</p>
                )}
            </div>
            <p className="m-0 border-t border-line px-4 py-3 text-[13px] text-ink-3">{t('pdfHint')}</p>
        </aside>
    )
}

// BookScreen is screen 2.3, one PFE book: its header, every topic filtered by field, and the original PDF beside them.
export default function BookScreen({ id }: { id: string }) {
    const t = useTranslations('book')
    const tc = useTranslations('common')
    const ts = useTranslations('book.topicShort')
    const format = useFormatter()
    const res = useBook(id)
    // A PDF kept by 9itchi is read with the session; one the company hosts is linked as it is.
    const kept = useBookPdf(id, !!res.data?.has_pdf && !res.data?.pdf_url)
    const cv = useMyCv()
    const [field, setField] = useState<Topic | 'all'>('all')
    const [selectedId, setSelectedId] = useState<string>()
    const [page, setPage] = useState<number>()
    const [all, setAll] = useState(false)

    if (res.isError) {
        const gone = isAxiosError(res.error) && [400, 404].includes(res.error.response?.status ?? 0)
        return (
            <main className="mx-auto w-full max-w-[1320px] px-4 sm:px-8 py-8">
                <p role="alert" className="m-0 text-ink-3">
                    {gone ? t('notFound') : tc('error')}
                </p>
            </main>
        )
    }
    const book = res.data ? { ...res.data, pdf_url: res.data.pdf_url ?? kept.url ?? null } : undefined
    const topics = book?.jobs ?? []
    const counts = TOPICS.map((tp) => [tp, topics.filter((j) => j.topic === tp).length] as const).filter(([, n]) => n > 0)
    const list = field === 'all' ? topics : topics.filter((j) => j.topic === field)
    const shown = all ? list : list.slice(0, SHOWN)
    const selected = topics.find((j) => j.id === selectedId) ?? topics[0]
    const current = page ?? selected?.pdf_page ?? 1

    return (
        <>
            <section>
                <div className="mx-auto box-border flex max-w-[1320px] flex-col gap-[22px] px-4 sm:px-8 pb-7 pt-[22px]">
                    <nav aria-label={t('crumbs')} className="flex items-center gap-2 text-sm text-ink-3">
                        <Link href="/jobs" className="no-underline">
                            {t('offers')}
                        </Link>
                        <span aria-hidden>/</span>
                        <Link href="/books" className="no-underline">
                            {t('books')}
                        </Link>
                        <span aria-hidden>/</span>
                        <span className="font-medium text-ink">{book?.company ?? '…'}</span>
                    </nav>
                    {book ? (
                        <>
                            <div className="flex flex-wrap items-center gap-7">
                                <BigCover book={book} />
                                <div className="flex flex-[1_1_420px] flex-col gap-2.5">
                                    <span className={label}>
                                        {t('eyebrow', {
                                            date: format.dateTime(new Date(`${book.published_on}T00:00:00`), {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            }),
                                        })}
                                    </span>
                                    <h1 className="m-0 text-[34px] font-extrabold leading-[1.1]">{book.title}</h1>
                                    {book.summary ? <p className="m-0 max-w-[680px] text-[15px] leading-relaxed text-ink-3">{book.summary}</p> : null}
                                    {book.pdf_url ? (
                                        <div className="mt-1 flex flex-wrap gap-2.5">
                                            <a
                                                href={book.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download={`${book.company} - ${book.title}.pdf`}
                                                className={btn2}
                                            >
                                                <Icon name="download" size={16} />
                                                {book.pages ? t('downloadPages', { count: book.pages }) : t('download')}
                                            </a>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <Facts book={book} />
                        </>
                    ) : (
                        <div className="flex items-center gap-7">
                            <Sk className="h-[148px] w-28 rounded-[6px_22px_6px_6px]" />
                            <span className="flex flex-1 flex-col gap-3">
                                <Sk className="h-3 w-48" />
                                <Sk className="h-8 w-[60%]" />
                                <Sk className="h-4 w-[70%]" />
                            </span>
                        </div>
                    )}
                </div>
            </section>
            {book ? (
                <main className="mx-auto box-border flex w-full max-w-[1320px] flex-wrap items-start gap-7 px-4 sm:px-8 pb-16 pt-7">
                    <section aria-label={t('topics', { count: topics.length })} className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="m-0 text-xl font-extrabold">{t('topics', { count: topics.length })}</h2>
                            {counts.length > 1 ? (
                                <div role="group" aria-label={t('topics', { count: topics.length })} className="flex flex-wrap gap-1.5">
                                    {[['all', topics.length] as const, ...counts].map(([k, n]) => (
                                        <button
                                            key={k}
                                            type="button"
                                            aria-pressed={field === k}
                                            onClick={() => setField(k)}
                                            className={cn(
                                                'h-[34px] cursor-pointer rounded-full border px-3 text-[13px] font-semibold',
                                                field === k ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink-2',
                                            )}
                                        >
                                            {k === 'all' ? t('all', { count: n }) : `${ts(k)} ${n}`}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        {shown.map((j) => (
                            <TopicCard
                                key={j.id}
                                job={j}
                                cvSkills={cv.skills}
                                selected={j.id === selected?.id}
                                onSelect={() => {
                                    setSelectedId(j.id)
                                    setPage(j.pdf_page ?? undefined)
                                }}
                            />
                        ))}
                        {list.length > shown.length ? (
                            <span className="text-[13px] text-ink-3">
                                {t('shown', { shown: shown.length, total: list.length })} ·{' '}
                                <button
                                    type="button"
                                    onClick={() => setAll(true)}
                                    className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-violet"
                                >
                                    {t('showAll')}
                                </button>
                            </span>
                        ) : null}
                    </section>
                    <PdfPanel
                        book={book}
                        state={pdfState({ hostedUrl: res.data?.pdf_url, hasKept: !!res.data?.has_pdf, keptUrl: kept.url, failed: kept.isError })}
                        loaded={kept.loaded}
                        onRetry={kept.retry}
                        page={current}
                        onPage={setPage}
                    />
                </main>
            ) : null}
        </>
    )
}
