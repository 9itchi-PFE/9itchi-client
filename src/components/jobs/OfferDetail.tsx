'use client'

import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { Bolt, Icon } from '@/components/ui/icons'
import { useJob } from '@/hooks/useJobs'
import { cn } from '@/lib/cn'
import type { JobSummary } from '@/types/job'
import AiMatch from './AiMatch'
import { CompanyBadge } from './OfferCard'
import { city, match, sourceName } from './offer'

// BookCover is the small book drawn for PFE books (folded corner, year in mono).
export function BookCover({ year, color = '#D6F25E', className }: { year: number | string; color?: string; className?: string }) {
    return (
        <span
            aria-hidden
            style={{ background: color }}
            className={cn(
                'box-border flex h-[46px] w-9 flex-none items-end rounded-[3px_9px_3px_3px] p-1 font-mono text-[8px] font-semibold text-ink',
                className,
            )}
        >
            {String(year).slice(-2)}
        </span>
    )
}

// OfferDetail is the sticky side panel of the offers screen: facts, how to apply, what fits the CV, the topic, its book.
export default function OfferDetail({ summary, cvSkills, hasCv, resumeId }: { summary: JobSummary; cvSkills: string[]; hasCv: boolean; resumeId?: string }) {
    const t = useTranslations('offers')
    const tm = useTranslations('prefs.modes')
    const format = useFormatter()
    const full = useJob(summary.id).data
    const job = full && full.id === summary.id ? full : null
    const source = sourceName(summary.source)
    const m = match(summary.skills, cvSkills)
    const book = job?.book ?? null
    const place = city(summary, t('remote'))
    const start = job?.starts_on ? new Date(`${job.starts_on}T00:00:00`) : null

    const facts: [string, string][] = [
        [
            t('factPay'),
            summary.stipend_tnd == null ? t('unknown') : summary.stipend_tnd > 0 ? t('perMonth', { amount: format.number(summary.stipend_tnd) }) : t('unpaid'),
        ],
        [t('factLength'), summary.duration_months ? t('months', { count: summary.duration_months }) : t('unknown')],
        [t('factStart'), start ? format.dateTime(start, { day: 'numeric', month: 'short', year: 'numeric' }) : job ? t('unknown') : '…'],
        [t('factMode'), summary.work_mode ? tm(summary.work_mode) : t('unknown')],
    ]
    const subtitle = [book?.sector, place].filter(Boolean).join(' · ')
    const applyHref = `/jobs/${summary.id}/apply`

    return (
        <aside
            aria-label={t('details')}
            className="sticky top-[92px] flex min-w-0 flex-[1_1_440px] flex-col overflow-hidden rounded-[20px] border-[1.5px] border-ink bg-white shadow-card"
        >
            <div className="flex flex-col gap-[18px] px-[26px] pb-[22px] pt-[26px]">
                <div className="flex items-center gap-3">
                    <CompanyBadge company={summary.company} size={48} className="text-[15px]" />
                    <div className="flex min-w-0 flex-col">
                        <span className="text-[15px] font-semibold">{summary.company}</span>
                        {subtitle ? <span className="text-[13.5px] text-ink-3">{subtitle}</span> : null}
                    </div>
                </div>
                <h2 className="m-0 text-[27px] font-extrabold leading-[1.15]">{summary.title}</h2>
                <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line-soft">
                    {facts.map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-[3px] bg-[#FAFAFB] px-3.5 py-3">
                            <dt className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{k}</dt>
                            <dd className="m-0 text-[15px] font-semibold">{v}</dd>
                        </div>
                    ))}
                </dl>
                <div className="flex flex-col gap-2">
                    <Link
                        href={applyHref}
                        className="flex h-[54px] items-center justify-center gap-2.5 rounded-[14px] bg-ink text-base font-semibold text-white no-underline hover:bg-black hover:text-white"
                    >
                        {summary.easy_apply ? <Bolt /> : null}
                        {summary.easy_apply ? t('apply') : t('prepare')}
                    </Link>
                    <span className="text-center text-[13px] leading-normal text-ink-3">
                        {summary.easy_apply ? t('applyNote') : t('prepareNote', { source })}
                    </span>
                    {summary.easy_apply ? (
                        <Link
                            href={`${applyHref}?cv=1`}
                            className="flex h-11 items-center justify-center rounded-xl border border-line-strong bg-white text-[14.5px] font-semibold text-ink no-underline hover:text-ink"
                        >
                            {t('sendCv')}
                        </Link>
                    ) : (
                        <a
                            href={summary.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-11 items-center justify-center rounded-xl border border-line-strong bg-white text-[14.5px] font-semibold text-ink no-underline hover:text-ink"
                        >
                            {t('applyOn', { source })}
                        </a>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-[22px] border-t border-line-soft px-[26px] pb-[26px] pt-[22px]">
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 className="m-0 font-display text-[17px] font-extrabold tracking-tightish">{t('fitTitle')}</h3>
                        {m && hasCv ? (
                            <span className="text-[13px] text-ink-3">{t('fitCount', { n: m.fits.length, total: summary.skills.length })}</span>
                        ) : null}
                    </div>
                    {m ? (
                        <div className="flex flex-wrap gap-1.5">
                            {(hasCv ? m.fits : []).map((s) => (
                                <span key={s} className="inline-flex h-7 items-center gap-[5px] rounded-full bg-lime px-2.5 text-[13px] font-semibold text-ink">
                                    <Icon name="check" size={13} strokeWidth={3} />
                                    {s}
                                </span>
                            ))}
                            {(hasCv ? m.others : summary.skills).map((s) => (
                                <span
                                    key={s}
                                    className="inline-flex h-7 items-center rounded-full border border-dashed border-[#C9CDD5] bg-white px-2.5 text-[13px] font-medium text-ink-3"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) : null}
                    <p className="m-0 text-[13.5px] leading-[1.55] text-ink-3">
                        {!m ? t('fitNone') : !hasCv ? t('fitNoCv') : m.others.length === 0 ? t('fitAll') : t('fitMissing', { skills: m.others.join(t('or')) })}
                    </p>
                </div>
                {hasCv && resumeId ? <AiMatch key={summary.id} jobId={summary.id} resumeId={resumeId} /> : null}
                <div className="flex flex-col gap-2">
                    <h3 className="m-0 font-display text-[17px] font-extrabold tracking-tightish">{t('about')}</h3>
                    <p className="m-0 whitespace-pre-line text-[15px] leading-[1.65] text-ink-2">
                        {job ? job.description || summary.snippet : summary.snippet}
                    </p>
                </div>
                {book ? (
                    <Link
                        href={`/books/${book.id}`}
                        className="flex items-center gap-3 rounded-xl bg-[#F6F8EA] px-3.5 py-3 text-sm text-ink no-underline hover:text-ink"
                    >
                        <BookCover year={book.year} className="h-9 w-7" />
                        <span className="flex-1">
                            {t.rich('partOfBook', {
                                company: book.company,
                                count: Math.max(book.open_jobs - 1, 0),
                                b: (c) => <strong className="font-semibold">{c}</strong>,
                            })}
                        </span>
                        <Icon name="arrow" size={16} className="rtl:rotate-180" />
                    </Link>
                ) : null}
                <span className="text-[12.5px] text-ink-3">
                    {summary.book_id
                        ? t('byBook', { company: summary.company })
                        : summary.easy_apply
                          ? t('byCompany', { company: summary.company })
                          : t('bySite', { source })}
                </span>
            </div>
        </aside>
    )
}
