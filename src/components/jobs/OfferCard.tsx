'use client'

import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { logoUrl, useLogos } from '@/hooks/useJobs'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { JobSummary } from '@/types/job'
import { city, deadline, fresh, initials, match, sourceName, tint } from './offer'

// CompanyBadge is the company's logo when the team gave one, else the tinted square with its initials. A logo
// that fails to load falls back to the initials too.
export function CompanyBadge({ company, size = 52, className }: { company: string; size?: number; className?: string }) {
    const logos = useLogos()
    const src = logoUrl(logos.data, company)
    const [broken, setBroken] = useState('')
    if (src && broken !== src) {
        return (
            <span
                aria-hidden
                style={{ width: size, height: size }}
                className={cn('flex flex-none items-center justify-center overflow-hidden rounded-[14px] border border-line-soft bg-white p-1.5', className)}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- a small logo from job-api, cached by its version */}
                <img src={src} alt="" className="h-full w-full object-contain" onError={() => setBroken(src)} />
            </span>
        )
    }
    return (
        <span
            aria-hidden
            style={{ width: size, height: size, background: tint(company) }}
            className={cn('flex flex-none items-center justify-center rounded-[14px] font-bold', size >= 48 ? 'text-base' : 'text-[12.5px]', className)}
        >
            {initials(company)}
        </span>
    )
}

// Deadline is « Ferme dans 3 jours » (orange within a week) or « Ferme le 15 déc. ».
export function DeadlineText({ closesOn, className }: { closesOn: string | null; className?: string }) {
    const t = useTranslations('offers')
    const format = useFormatter()
    const d = deadline(closesOn)
    if (!d || d.kind === 'closed') return null
    return (
        <span className={cn('font-medium', d.kind === 'soon' ? 'text-warn-fg' : 'text-ink-3', className)}>
            {d.kind === 'soon' ? t('closesIn', { days: d.days }) : t('closesOn', { date: format.dateTime(d.date, { day: 'numeric', month: 'short' }) })}
        </span>
    )
}

// Facts are the stipend, length and work mode line of a card.
export function Facts({ job }: { job: Pick<JobSummary, 'stipend_tnd' | 'duration_months' | 'work_mode'> }) {
    const t = useTranslations('offers')
    const tm = useTranslations('prefs.modes')
    const format = useFormatter()
    return (
        <span className="flex flex-wrap gap-4">
            {job.stipend_tnd != null ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
                    <Icon name="money" size={15} className="text-ink-3" />
                    <strong className="font-semibold text-ink">
                        {job.stipend_tnd > 0 ? t('perMonth', { amount: format.number(job.stipend_tnd) }) : t('unpaid')}
                    </strong>
                </span>
            ) : null}
            {job.duration_months ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
                    <Icon name="clock" size={15} className="text-ink-3" />
                    {t('months', { count: job.duration_months })}
                </span>
            ) : null}
            {job.work_mode ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
                    <Icon name="place" size={15} className="text-ink-3" />
                    {tm(job.work_mode)}
                </span>
            ) : null}
        </span>
    )
}

// OfferCard is one offer of the list (screen 2.1): company, title, facts, how it fits the CV, how to apply, deadline, bookmark.
export default function OfferCard({
    job,
    cvSkills,
    selected,
    onSelect,
    onToggleSave,
}: {
    job: JobSummary
    cvSkills: string[]
    selected: boolean
    onSelect: () => void
    onToggleSave: () => void
}) {
    const t = useTranslations('offers')
    const m = cvSkills.length ? match(job.skills, cvSkills) : null
    const place = city(job, t('remote'))
    return (
        <article
            className={cn(
                'flex gap-2 rounded-2xl border-[1.5px] bg-white p-5 transition-shadow',
                selected ? 'border-ink shadow-[0_1px_2px_rgba(16,24,40,.06)]' : 'border-line-soft shadow-[0_1px_2px_rgba(16,24,40,.04)]',
            )}
        >
            <button
                type="button"
                onClick={onSelect}
                aria-pressed={selected}
                className="flex min-w-0 flex-1 cursor-pointer gap-4 border-0 bg-transparent p-0 text-start"
            >
                <CompanyBadge company={job.company} />
                <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <span className="flex flex-col gap-[3px]">
                        <span className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-3">
                            <span className="font-semibold text-ink">{job.company}</span>
                            {place ? (
                                <>
                                    <span aria-hidden>·</span>
                                    <span>{place}</span>
                                </>
                            ) : null}
                            {fresh(job.posted_at) ? (
                                <span className="rounded-full bg-violet-soft px-[7px] py-px text-xs font-semibold text-violet-hover">{t('isNew')}</span>
                            ) : null}
                        </span>
                        <span className="text-[17px] font-semibold leading-[1.35] tracking-[-0.005em]">{job.title}</span>
                    </span>
                    <Facts job={job} />
                    <span className="flex flex-wrap items-center gap-2.5 text-[13px]">
                        {m ? (
                            <span
                                className={cn(
                                    'inline-flex h-6 items-center rounded-full px-[9px]',
                                    m.strong ? 'bg-lime font-semibold text-ink' : 'bg-fill font-medium text-ink-2',
                                )}
                            >
                                {m.strong
                                    ? t('fitStrong', { n: m.fits.length, total: job.skills.length })
                                    : t('fit', { n: m.fits.length, total: job.skills.length })}
                            </span>
                        ) : null}
                        <span className="text-ink-3">{job.easy_apply ? t('easyApply') : t('onSite', { source: sourceName(job.source) })}</span>
                        <DeadlineText closesOn={job.closes_on} className="ms-auto" />
                    </span>
                </span>
            </button>
            <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={job.saved}
                aria-label={t('save', { company: job.company })}
                className="-me-1.5 -mt-1.5 flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink hover:bg-fill"
            >
                <Icon name="bookmark" size={20} strokeWidth={1.8} fill={job.saved ? '#101218' : 'none'} />
            </button>
        </article>
    )
}
