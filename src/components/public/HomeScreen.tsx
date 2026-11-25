'use client'

import { useLocale, useTranslations } from 'next-intl'
import { dinars, months, regularOf } from '@/components/billing/billing'
import { ButtonLink } from '@/components/ui/Button'
import { usePlans } from '@/hooks/usePlans'
import { cn } from '@/lib/cn'
import type { Plan } from '@/types/plan'
import PublicHeader, { PublicFooter } from './PublicHeader'

const FREE = ['free1', 'free2', 'free3', 'free4', 'free5'] as const
const PAID = ['paid1', 'paid2', 'paid3', 'paid4', 'paid5'] as const
const STEPS = [1, 2, 3] as const
const FAQ = [1, 2, 3, 4] as const
const section = 'mx-auto box-border w-full max-w-[1200px] px-4 sm:px-8'

function Check() {
    return (
        <span aria-hidden className="mt-px flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-ok-bg text-xs font-bold text-ink">
            ✓
        </span>
    )
}

// PlanCard is one paid plan, at the price payments-api gives today (launch price and sale included).
function PlanCard({ plan }: { plan: Plan }) {
    const t = useTranslations('public')
    const locale = useLocale()
    const regular = regularOf(plan)
    const m = months(plan.duration_days)
    return (
        <div className="flex flex-col gap-4 rounded-[20px] border-[1.5px] border-ink bg-white p-7 shadow-card">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{plan.name || t('paidName')}</span>
            <div className="flex items-baseline gap-2.5">
                {regular ? <span className="text-lg text-ink-3 line-through">{dinars(regular / 1000, locale)} DT</span> : null}
                <b className="font-display text-[44px] font-extrabold leading-none">{dinars(plan.price, locale)} DT</b>
                <span className="text-[15px] text-ink-3">{m === 1 ? t('perMonth') : t('perDays', { count: plan.duration_days })}</span>
            </div>
            <span className="text-sm text-ink-3">{regular ? t('paidLaunchNote') : t('paidNote')}</span>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {PAID.map((k) => (
                    <li key={k} className="flex gap-2.5 text-[15px] text-ink-2">
                        <Check />
                        <span>{t(k)}</span>
                    </li>
                ))}
            </ul>
            <ButtonLink href="/auth/signup" className="mt-auto">
                {t('paidCta')}
            </ButtonLink>
        </div>
    )
}

// HomeScreen is the public home page (screen 7.1): what 9itchi does, how it works, the prices, the questions.
export default function HomeScreen() {
    const t = useTranslations('public')
    const plans = usePlans()
    const paid = (plans.data?.items ?? []).filter((p) => p.active && p.price > 0).sort((a, b) => a.price - b.price)
    return (
        <div className="min-h-screen bg-page">
            <PublicHeader />
            <main className="flex flex-col gap-20 pb-20 pt-10 sm:gap-24 sm:pt-16">
                <section className={cn(section, 'grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]')}>
                    <div className="flex flex-col gap-6">
                        <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.02] tracking-tightish sm:text-[60px]">
                            {t('heroTitle')} <span className="rounded-xl bg-lime px-2">{t('heroTitleEnd')}</span>
                        </h1>
                        <p className="m-0 max-w-[560px] text-lg leading-relaxed text-ink-2">{t('heroText')}</p>
                        <div className="flex flex-wrap gap-3">
                            <ButtonLink href="/auth/signup" size="lg">
                                {t('heroCta')}
                            </ButtonLink>
                            <ButtonLink href="/auth/signin" size="lg" variant="secondary">
                                {t('heroSecondary')}
                            </ButtonLink>
                        </div>
                        <span className="text-sm text-ink-3">{t('heroNote')}</span>
                    </div>
                    {/* An illustration of what the student gets: an offer that fits, an application opened. */}
                    <div aria-hidden className="relative hidden min-h-[300px] lg:block">
                        <div className="absolute start-0 top-2 flex w-[340px] flex-col gap-2 rounded-2xl border border-line-soft bg-white p-5 shadow-paper">
                            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[.08em] text-ink-4">{t('demoLabel')}</span>
                            <span className="text-sm text-ink-3">{t('demoCompany')}</span>
                            <strong className="text-[17px]">{t('demoTitle')}</strong>
                            <span className="flex gap-2">
                                <span className="rounded-full bg-lime px-2.5 py-1 text-[13px] font-semibold">{t('demoFit')}</span>
                                <span className="rounded-full bg-fill px-2.5 py-1 text-[13px] font-semibold text-ink-2">{t('demoPay')}</span>
                            </span>
                        </div>
                        <div className="absolute bottom-0 end-0 flex w-[300px] flex-col gap-1.5 rounded-2xl border-[1.5px] border-ink bg-white p-5 shadow-card">
                            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[.08em] text-ink-3">{t('demoAppLabel')}</span>
                            <strong className="text-[17px]">{t('demoAppTitle')}</strong>
                            <span className="text-sm text-ink-3">{t('demoAppText')}</span>
                        </div>
                    </div>
                </section>

                <section id="how" aria-labelledby="how-h" className={cn(section, 'flex scroll-mt-24 flex-col gap-6')}>
                    <h2 id="how-h" className="m-0 font-display text-[32px] font-extrabold sm:text-[40px]">
                        {t('howTitle')}
                    </h2>
                    <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
                        {STEPS.map((n) => (
                            <li key={n} className="flex flex-col gap-2.5 rounded-[20px] border border-line-soft bg-white p-6">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-sm font-semibold text-white">
                                    {n}
                                </span>
                                <h3 className="m-0 text-lg font-extrabold">{t(`step${n}Title`)}</h3>
                                <p className="m-0 text-[15px] leading-relaxed text-ink-2">{t(`step${n}Text`)}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section id="pricing" aria-labelledby="pricing-h" className={cn(section, 'flex scroll-mt-24 flex-col gap-6')}>
                    <div className="flex flex-col gap-2">
                        <h2 id="pricing-h" className="m-0 font-display text-[32px] font-extrabold sm:text-[40px]">
                            {t('pricingTitle')}
                        </h2>
                        <p className="m-0 text-[17px] text-ink-2">{t('pricingText')}</p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="flex flex-col gap-4 rounded-[20px] border border-line-soft bg-white p-7">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{t('freeName')}</span>
                            <b className="font-display text-[44px] font-extrabold leading-none">{t('freePrice')}</b>
                            <span className="text-sm text-ink-3">{t('freeFor')}</span>
                            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                                {FREE.map((k) => (
                                    <li key={k} className="flex gap-2.5 text-[15px] text-ink-2">
                                        <Check />
                                        <span>{t(k)}</span>
                                    </li>
                                ))}
                            </ul>
                            <ButtonLink href="/auth/signup" variant="secondary" className="mt-auto">
                                {t('freeCta')}
                            </ButtonLink>
                        </div>
                        {paid.length ? (
                            paid.map((p) => <PlanCard key={p.id} plan={p} />)
                        ) : (
                            <div className="flex items-center justify-center rounded-[20px] border border-dashed border-line-strong p-7 text-[15px] text-ink-3">
                                {plans.isLoading ? '…' : t('noPlan')}
                            </div>
                        )}
                    </div>
                </section>

                <section aria-labelledby="faq-h" className={cn(section, 'flex max-w-[860px] flex-col gap-4')}>
                    <h2 id="faq-h" className="m-0 font-display text-[32px] font-extrabold sm:text-[40px]">
                        {t('faqTitle')}
                    </h2>
                    {FAQ.map((n) => (
                        <details key={n} className="group rounded-2xl border border-line-soft bg-white px-5 py-4">
                            <summary className="cursor-pointer list-none text-base font-semibold marker:hidden">{t(`q${n}`)}</summary>
                            <p className="m-0 mt-3 text-[15px] leading-relaxed text-ink-2">{t(`a${n}`)}</p>
                        </details>
                    ))}
                </section>
            </main>
            <PublicFooter />
        </div>
    )
}
