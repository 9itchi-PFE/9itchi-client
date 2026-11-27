import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { CompanyBadge, DeadlineText, Facts } from '@/components/jobs/OfferCard'
import { fresh } from '@/components/jobs/offer'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { cityOf } from '@/lib/slug'
import type { PublicFacet, PublicOfferItem, PublicOffers } from '@/types/job'
import { type ListKind, pagePath } from './listPaths'
import PublicHeader, { PublicFooter } from './PublicHeader'

const main = 'mx-auto box-border flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 pb-20 pt-8 sm:px-8 lg:flex-row lg:items-start'
const chip = 'hit rounded-full border border-line-strong bg-white px-3 py-1.5 text-[13.5px] font-medium text-ink-2 no-underline hover:border-ink hover:text-ink'

// OfferList is a public list of open offers (all, one city, one company), drawn on the server so search engines
// read every offer, with links to the other cities and companies and the way to sign up. Same frame as the shared
// offer page (PublicOffer): header, list on the start side, the sign-up card and the other lists on the end side.
export default async function OfferList({ list, data }: { list: ListKind; data: PublicOffers | null }) {
    const t = await getTranslations('public.list')
    const title =
        list.kind === 'all' ? t('allTitle') : list.kind === 'city' ? t('cityTitle', { city: list.facet.name }) : t('companyTitle', { company: list.facet.name })
    const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1
    const intro = !data
        ? null
        : list.kind === 'all'
          ? t('allIntro', { count: data.total })
          : list.kind === 'city'
            ? t('cityIntro', { count: data.total, city: list.facet.name })
            : t('companyIntro', { count: data.total, company: list.facet.name })

    return (
        <div className="flex min-h-screen min-h-dvh flex-col bg-page">
            <PublicHeader />
            <main className={main}>
                <div className="flex min-w-0 flex-1 flex-col gap-6">
                    <nav aria-label={t('offers')} className="text-sm font-semibold leading-relaxed text-ink-3">
                        <Link href="/" className="hit text-ink-3 no-underline hover:text-ink">
                            {t('home')}
                        </Link>
                        <span aria-hidden className="mx-1.5 inline-block rtl:-scale-x-100">
                            ›
                        </span>
                        {list.kind === 'all' ? (
                            <span aria-current="page" className="text-ink">
                                {t('offers')}
                            </span>
                        ) : (
                            <>
                                <Link href="/offres" className="hit text-ink-3 no-underline hover:text-ink">
                                    {t('offers')}
                                </Link>
                                <span aria-hidden className="mx-1.5 inline-block rtl:-scale-x-100">
                                    ›
                                </span>
                                <span aria-current="page" className="text-ink">
                                    {list.facet.name}
                                </span>
                            </>
                        )}
                    </nav>
                    <header className="flex flex-col gap-2">
                        <h1 className="m-0 font-display text-[30px] font-extrabold leading-[1.1] sm:text-[40px]">{title}</h1>
                        {intro ? <p className="m-0 text-base text-ink-2">{intro}</p> : null}
                    </header>
                    {!data ? (
                        <section className="flex flex-col gap-2 rounded-[20px] border border-line-soft bg-white p-6">
                            <h2 className="m-0 text-lg font-extrabold">{t('errorTitle')}</h2>
                            <p className="m-0 text-[15px] text-ink-2">{t('errorText')}</p>
                        </section>
                    ) : data.items.length === 0 ? (
                        <section className="flex flex-col items-start gap-3 rounded-[20px] border border-line-soft bg-white p-6">
                            <h2 className="m-0 text-lg font-extrabold">{t('emptyTitle')}</h2>
                            <p className="m-0 text-[15px] text-ink-2">{t('emptyText')}</p>
                            <ButtonLink href="/auth/signup">{t('signUp')}</ButtonLink>
                        </section>
                    ) : (
                        <ol className="m-0 flex list-none flex-col gap-3 p-0">
                            {data.items.map((o) => (
                                <li key={o.id}>
                                    <OfferRow offer={o} remote={t('remote')} isNew={t('isNew')} easyApply={t('easyApply')} />
                                </li>
                            ))}
                        </ol>
                    )}
                    {data && pages > 1 ? (
                        <nav aria-label={t('pageOf', { page: data.page, pages })} className="flex flex-wrap items-center gap-3">
                            {data.page > 1 ? (
                                <ButtonLink href={pagePath(list, data.page - 1)} variant="secondary" size="sm" rel="prev">
                                    {t('prev')}
                                </ButtonLink>
                            ) : null}
                            <span className="text-sm text-ink-3">{t('pageOf', { page: data.page, pages })}</span>
                            {data.page < pages ? (
                                <ButtonLink href={pagePath(list, data.page + 1)} variant="secondary" size="sm" rel="next">
                                    {t('next')}
                                </ButtonLink>
                            ) : null}
                        </nav>
                    ) : null}
                </div>
                <aside className="flex w-full flex-none flex-col gap-4 lg:sticky lg:top-[92px] lg:w-[380px]">
                    <section className="flex flex-col gap-4 rounded-[20px] border-[1.5px] border-ink bg-white p-6 shadow-card">
                        <span className="self-start rounded-full bg-lime px-2.5 py-1 text-[13px] font-semibold">{t('ctaTag')}</span>
                        <h2 className="m-0 text-[22px] font-extrabold leading-tight">{t('ctaTitle')}</h2>
                        <p className="m-0 text-[15px] leading-relaxed text-ink-2">{t('ctaText')}</p>
                        <ButtonLink href="/auth/signup" size="lg">
                            {t('signUp')}
                        </ButtonLink>
                        <Link href="/auth/signin" className="hit text-center text-sm font-semibold no-underline">
                            {t('signIn')}
                        </Link>
                    </section>
                    {data ? (
                        <>
                            <FacetLinks title={t('byCity')} kind="ville" items={data.cities} current={list.kind === 'city' ? list.facet.slug : ''} />
                            <FacetLinks
                                title={t('byCompany')}
                                kind="entreprise"
                                items={data.companies.slice(0, 30)}
                                current={list.kind === 'company' ? list.facet.slug : ''}
                            />
                        </>
                    ) : null}
                </aside>
            </main>
            <PublicFooter />
        </div>
    )
}

// OfferRow is one offer of a public list: the same reading order as the student's offer card (company and place,
// title, facts, how to apply, deadline), its title a link to the shared offer page.
function OfferRow({ offer: o, remote, isNew, easyApply }: { offer: PublicOfferItem; remote: string; isNew: string; easyApply: string }) {
    const place = o.work_mode === 'remote' ? remote : cityOf(o.location) || o.location
    return (
        <article className="flex gap-4 rounded-2xl border-[1.5px] border-line-soft bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
            <CompanyBadge company={o.company} />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex flex-col gap-[3px]">
                    <span className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-3">
                        <span className="font-semibold text-ink">{o.company}</span>
                        {place ? (
                            <>
                                <span aria-hidden>·</span>
                                <span>{place}</span>
                            </>
                        ) : null}
                        {fresh(o.posted_at) ? (
                            <span className="rounded-full bg-violet-soft px-[7px] py-px text-xs font-semibold text-violet-hover">{isNew}</span>
                        ) : null}
                    </span>
                    <h2 className="m-0 text-[17px] font-semibold leading-[1.35] tracking-[-0.005em]">
                        <Link href={`/offres/${o.id}`} className="hit text-ink no-underline hover:underline">
                            {o.title}
                        </Link>
                    </h2>
                </div>
                <Facts job={o} />
                <span className="flex flex-wrap items-center gap-2.5 text-[13px]">
                    {o.easy_apply ? <span className="text-ink-3">{easyApply}</span> : null}
                    <DeadlineText closesOn={o.closes_on} className="ms-auto" />
                </span>
            </div>
        </article>
    )
}

// FacetLinks are the other cities or companies with open offers, each a link to its own page.
function FacetLinks({ title, kind, items, current }: { title: string; kind: 'ville' | 'entreprise'; items: PublicFacet[]; current: string }) {
    if (items.length === 0) return null
    return (
        <nav aria-label={title} className="flex flex-col gap-3 rounded-[20px] border border-line-soft bg-white p-6">
            <h2 className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-ink-3">{title}</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {items.map((f) => (
                    <li key={f.slug}>
                        <Link
                            href={`/offres/${kind}/${f.slug}`}
                            aria-current={f.slug === current ? 'page' : undefined}
                            className={cn(chip, f.slug === current && 'border-ink bg-ink text-white hover:text-white')}
                        >
                            {f.name} <span className={cn(f.slug === current ? 'text-white/70' : 'text-ink-3')}>{f.count}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
