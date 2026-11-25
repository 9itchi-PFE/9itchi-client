'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { Sk } from '@/components/jobs/OfferStates'
import { CompanyBadge } from '@/components/jobs/OfferCard'
import { sourceName } from '@/components/jobs/offer'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { usePublicJob } from '@/hooks/useJobs'
import { errorStatus } from '@/services/ApiService'
import PublicHeader, { PublicFooter } from './PublicHeader'

const main = 'mx-auto box-border flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 pb-20 pt-8 sm:px-8 lg:flex-row lg:items-start'

// PublicOffer is screen 7.2: an offer shared by link, for someone with no account. Applying needs an account,
// so the side card leads to sign-up (or sign-in, back to the same offer inside 9itchi).
export default function PublicOffer({ id }: { id: string }) {
    const t = useTranslations('public.offer')
    const tm = useTranslations('prefs.modes')
    const format = useFormatter()
    const toast = useToast()
    const offer = usePublicJob(id)
    const [copied, setCopied] = useState(false)
    const inside = `/jobs/${id}`

    const shell = (body: React.ReactNode) => (
        <div className="flex min-h-screen flex-col bg-page">
            <PublicHeader signInTo={inside} />
            {body}
            <PublicFooter />
        </div>
    )

    if (offer.isLoading) {
        return shell(
            <main aria-busy="true" aria-label={t('loading')} className={main}>
                <div className="flex flex-1 flex-col gap-4">
                    <Sk className="h-12 w-72 rounded-lg" />
                    <Sk className="h-[260px] w-full rounded-[20px]" />
                </div>
                <Sk className="h-[320px] w-full rounded-[20px] lg:w-[380px]" />
            </main>,
        )
    }
    if (offer.isError || !offer.data) {
        const gone = errorStatus(offer.error) === 404 || errorStatus(offer.error) === 400
        return shell(
            <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-8">
                <h1 className="m-0 font-display text-[30px] font-extrabold leading-tight">{gone ? t('notFoundTitle') : t('error')}</h1>
                {gone ? <p className="m-0 text-base text-ink-2">{t('notFoundText')}</p> : null}
                {gone ? <ButtonLink href="/">{t('notFoundCta')}</ButtonLink> : <Button onClick={() => offer.refetch()}>{t('retry')}</Button>}
            </main>,
        )
    }

    const o = offer.data
    const day = (d: string | null) => (d ? new Date(`${d}T00:00:00`) : null)
    const start = day(o.starts_on)
    const closes = day(o.closes_on)
    const facts: [string, string][] = [
        [t('pay'), o.stipend_tnd == null ? t('unknown') : o.stipend_tnd > 0 ? t('perMonth', { amount: format.number(o.stipend_tnd) }) : t('unpaid')],
        [t('length'), o.duration_months ? t('months', { count: o.duration_months }) : t('unknown')],
        [t('start'), start ? format.dateTime(start, { month: 'long', year: 'numeric' }) : t('unknown')],
        [t('mode'), [o.work_mode ? tm(o.work_mode) : null, o.location].filter(Boolean).join(' · ') || t('unknown')],
    ]
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            setCopied(true)
            toast(t('copied'))
        } catch {
            toast(window.location.href)
        }
    }

    return shell(
        <main className={main}>
            <article className="flex min-w-0 flex-1 flex-col gap-6">
                <Link href="/" className="text-sm font-semibold text-ink-3 no-underline hover:text-ink">
                    <span aria-hidden className="me-1 inline-block rtl:-scale-x-100">
                        ←
                    </span>
                    {t('back')}
                </Link>
                <div className="flex items-center gap-3">
                    <CompanyBadge company={o.company} size={52} className="text-[15px]" />
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-[15px]">
                            <strong>{o.company}</strong>
                            {o.location ? ` · ${o.location}` : ''}
                        </span>
                        <span className="flex flex-wrap gap-2">
                            {o.book_title ? (
                                <span className="rounded-full bg-violet-soft px-2.5 py-0.5 text-[12.5px] font-semibold text-violet-hover">
                                    {t('fromBook', { title: o.book_title })}
                                </span>
                            ) : null}
                            {o.closed ? (
                                <span className="rounded-full bg-warn-bg px-2.5 py-0.5 text-[12.5px] font-semibold text-warn-fg">{t('closed')}</span>
                            ) : closes ? (
                                <span className="rounded-full bg-fill px-2.5 py-0.5 text-[12.5px] font-semibold text-ink-2">
                                    {t('closes', { date: format.dateTime(closes, { day: 'numeric', month: 'long' }) })}
                                </span>
                            ) : null}
                        </span>
                    </div>
                </div>
                <h1 className="m-0 font-display text-[30px] font-extrabold leading-[1.1] sm:text-[40px]">{o.title}</h1>
                <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line-soft sm:grid-cols-4">
                    {facts.map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-[3px] bg-white px-4 py-3">
                            <dt className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{k}</dt>
                            <dd className="m-0 text-[15px] font-semibold">{v}</dd>
                        </div>
                    ))}
                </dl>
                <section className="flex flex-col gap-3 rounded-[20px] border border-line-soft bg-white p-6">
                    <h2 className="m-0 text-lg font-extrabold">{t('subject')}</h2>
                    <p className="m-0 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{o.description}</p>
                    {o.skills?.length ? (
                        <>
                            <h2 className="m-0 mt-3 text-lg font-extrabold">{t('skills')}</h2>
                            <div className="flex flex-wrap gap-2">
                                {o.skills.map((s) => (
                                    <span
                                        key={s}
                                        dir="ltr"
                                        className="rounded-full border border-line-strong bg-white px-2.5 py-1 text-[13px] font-medium text-ink-2"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : null}
                    <h2 className="m-0 mt-3 text-lg font-extrabold">{t('source')}</h2>
                    <p className="m-0 text-[15px] text-ink-2">
                        {o.book_company ? t('sourceBook', { company: o.book_company }) : t('sourceOther', { source: sourceName(o.source) })}
                    </p>
                </section>
            </article>
            <aside className="flex w-full flex-none flex-col gap-4 rounded-[20px] border-[1.5px] border-ink bg-white p-6 shadow-card lg:sticky lg:top-[92px] lg:w-[380px]">
                {o.closed ? null : <span className="self-start rounded-full bg-lime px-2.5 py-1 text-[13px] font-semibold">{t('ctaTag')}</span>}
                <h2 className="m-0 text-[22px] font-extrabold leading-tight">{o.closed ? t('ctaClosedTitle') : t('ctaTitle')}</h2>
                <p className="m-0 text-[15px] leading-relaxed text-ink-2">{o.closed ? t('ctaClosedText') : t('ctaText')}</p>
                <ButtonLink href="/auth/signup" size="lg">
                    {t('signUp')}
                </ButtonLink>
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(inside)}`} className="text-center text-sm font-semibold no-underline">
                    {t('signIn')}
                </Link>
                <Button variant="secondary" onClick={copy}>
                    {copied ? t('copied') : t('copy')}
                </Button>
            </aside>
        </main>,
    )
}
