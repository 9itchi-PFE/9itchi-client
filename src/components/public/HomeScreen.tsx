'use client'

import { useTranslations } from 'next-intl'
import { ButtonLink } from '@/components/ui/Button'
import { usePlans } from '@/hooks/usePlans'
import { cn } from '@/lib/cn'
import type { Plan } from '@/types/plan'
import PublicHeader, { PublicFooter } from './PublicHeader'

const FAQ = [1, 2, 3, 4] as const
const section = 'mx-auto box-border w-full max-w-[1200px] px-4 sm:px-8'

// freeApplications is how many applications the plan of a student with no subscription sends (Free plan in
// payments-api, set in the admin); 3 until /plans answers.
export function freeApplications(plans: Plan[] | undefined): number {
    return plans?.find((p) => p.price <= 0)?.quotas?.free_applications ?? 3
}

// HomeScreen is the public home page (screen 7.1): what 9itchi does and the common questions. How it works and
// the prices are left for the student to discover once signed in (the subscription page shows the plans).
export default function HomeScreen() {
    const t = useTranslations('public')
    const plans = usePlans()
    const count = freeApplications(plans.data?.items)
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

                <section aria-labelledby="faq-h" className={cn(section, 'flex max-w-[860px] flex-col gap-4')}>
                    <h2 id="faq-h" className="m-0 font-display text-[32px] font-extrabold sm:text-[40px]">
                        {t('faqTitle')}
                    </h2>
                    {FAQ.map((n) => (
                        <details key={n} className="group rounded-2xl border border-line-soft bg-white px-5 py-4">
                            <summary className="cursor-pointer list-none text-base font-semibold marker:hidden">{t(`q${n}`)}</summary>
                            <p className="m-0 mt-3 text-[15px] leading-relaxed text-ink-2">{t(`a${n}`, { count })}</p>
                        </details>
                    ))}
                </section>
            </main>
            <PublicFooter />
        </div>
    )
}
