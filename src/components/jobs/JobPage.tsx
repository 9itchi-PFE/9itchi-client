'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { Icon } from '@/components/ui/icons'
import { useJob, useSimilarJobs } from '@/hooks/useJobs'
import type { Job } from '@/types/job'
import { CompanyBadge } from './OfferCard'
import { OffersSkeleton } from './OfferStates'
import { city, deadline } from './offer'

const card = 'rounded-[20px] border border-line-soft bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]'

// ClosedOffer is screen « offre fermée »: the offer greyed out, where the student's application is, and open offers close to it.
function ClosedOffer({ job }: { job: Job }) {
    const t = useTranslations('offers')
    const format = useFormatter()
    const similar = useSimilarJobs(job.id, true)
    const d = deadline(job.closes_on)
    return (
        <main className="mx-auto box-border flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-8 pb-16 pt-8">
            <Link href="/jobs" className="text-sm font-semibold no-underline">
                {t('closedBack')}
            </Link>
            <section className={`${card} flex items-start gap-5 p-7`}>
                <CompanyBadge company={job.company} size={56} className="opacity-60" />
                <div className="flex flex-1 flex-col gap-2">
                    {d?.kind === 'closed' ? (
                        <span className="inline-flex h-[26px] items-center gap-1.5 self-start rounded-full bg-[#FFEDD5] px-2.5 text-[12.5px] font-semibold text-[#9A3412]">
                            <Icon name="clock" size={14} />
                            {t('closedOn', { date: format.dateTime(d.date, { day: 'numeric', month: 'long' }) })}
                        </span>
                    ) : null}
                    <h1 className="m-0 text-[28px] font-extrabold text-ink-3">{job.title}</h1>
                    <p className="m-0 text-[15px] leading-relaxed text-ink-3">
                        {t.rich('closedText', {
                            company: job.company,
                            link: (c) => (
                                <Link href="/applications" className="underline">
                                    {c}
                                </Link>
                            ),
                        })}
                    </p>
                </div>
            </section>
            <div className="flex flex-col gap-3">
                <h2 className="m-0 text-[22px] font-extrabold">{t('similarTitle')}</h2>
                {similar.data && similar.data.items.length === 0 ? <p className="m-0 text-ink-3">{t('similarNone')}</p> : null}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                    {(similar.data?.items ?? []).map((s) => (
                        <Link
                            key={s.id}
                            href={`/jobs?tab=all&job=${s.id}`}
                            className={`${card} flex flex-col gap-2.5 p-[18px] text-ink no-underline hover:text-ink`}
                        >
                            <span className="flex items-center gap-2.5">
                                <CompanyBadge company={s.company} size={36} className="rounded-[10px]" />
                                <span className="text-[13px] text-ink-3">{[s.company, city(s, t('remote'))].filter(Boolean).join(' · ')}</span>
                            </span>
                            <strong className="text-[15px] leading-[1.35]">{s.title}</strong>
                            <span className="text-[13.5px] font-semibold text-violet">{t('similarSee')}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}

// JobPage is a link to one offer: a closed offer gets its own screen, an open one opens in the offers screen.
export default function JobPage({ id }: { id: string }) {
    const t = useTranslations('offers')
    const tc = useTranslations('common')
    const router = useRouter()
    const job = useJob(id)
    const closed = job.data ? deadline(job.data.closes_on)?.kind === 'closed' : false
    useEffect(() => {
        if (job.data && !closed) router.replace(`/jobs?tab=all&job=${job.data.id}`)
    }, [job.data, closed, router])

    if (job.isError) {
        const gone = isAxiosError(job.error) && (job.error.response?.status === 404 || job.error.response?.status === 400)
        return (
            <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-8 pb-16 pt-8">
                <Link href="/jobs" className="text-sm font-semibold no-underline">
                    {t('closedBack')}
                </Link>
                <p role="alert" className="m-0 text-ink-3">
                    {gone ? t('notFound') : tc('error')}
                </p>
            </main>
        )
    }
    if (job.data && closed) return <ClosedOffer job={job.data} />
    return (
        <main className="mx-auto box-border w-full max-w-[1320px] px-8 pb-[72px] pt-5">
            <OffersSkeleton />
        </main>
    )
}
