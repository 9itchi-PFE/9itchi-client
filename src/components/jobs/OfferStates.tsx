'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { buttonClass } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

const box = 'rounded-[20px] border border-line-soft bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]'

// Sk is one shimmering placeholder bar of the loading screen.
export function Sk({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return <span style={style} className={cn('sk block', className)} />
}

// OffersSkeleton is the loading state (screen LoadOffers): four card outlines and the detail panel outline.
export function OffersSkeleton({ withDetail = true }: { withDetail?: boolean }) {
    const t = useTranslations('offers')
    return (
        <div aria-busy="true" className="flex items-start gap-7">
            <p role="status" className="sr-only">
                {t('loading')}
            </p>
            <div className="flex min-w-0 flex-[999_1_540px] flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 rounded-2xl border-[1.5px] border-line-soft bg-white p-5">
                        <Sk className="h-[52px] w-[52px] flex-none rounded-[14px]" />
                        <span className="flex flex-1 flex-col gap-2.5">
                            <Sk className="h-3 w-[34%]" />
                            <Sk className="h-[17px] w-[76%]" />
                            <span className="flex gap-3.5">
                                <Sk className="h-[13px] w-[110px]" />
                                <Sk className="h-[13px] w-[70px]" />
                                <Sk className="h-[13px] w-[70px]" />
                            </span>
                            <span className="flex gap-2.5">
                                <Sk className="h-[22px] w-[120px] rounded-full" />
                                <Sk className="mt-1 h-[13px] w-[60px]" />
                            </span>
                        </span>
                    </div>
                ))}
            </div>
            {withDetail ? (
                <div className={cn(box, 'hidden min-w-0 flex-[1_1_440px] flex-col gap-4 p-[26px] lg:flex')}>
                    <span className="flex items-center gap-3">
                        <Sk className="h-12 w-12 rounded-[14px]" />
                        <span className="flex flex-1 flex-col gap-2">
                            <Sk className="h-3.5 w-[45%]" />
                            <Sk className="h-3 w-[30%]" />
                        </span>
                    </span>
                    <Sk className="h-6 w-[85%]" />
                    <Sk className="h-6 w-[60%]" />
                    <span className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map((i) => (
                            <Sk key={i} className="h-14 rounded-xl" />
                        ))}
                    </span>
                    <Sk className="h-[54px] rounded-[14px]" />
                    <Sk className="h-3 w-full" />
                    <Sk className="h-3 w-[90%]" />
                    <Sk className="h-3 w-[70%]" />
                </div>
            ) : null}
        </div>
    )
}

// EmptySaved is the saved tab with nothing saved yet.
export function EmptySaved({ forYouHref }: { forYouHref: string }) {
    const t = useTranslations('offers')
    return (
        <section className={cn(box, 'flex flex-col items-center gap-3.5 px-8 py-14 text-center')}>
            <span className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-[22px] bg-fill">
                <Icon name="bookmark" size={32} />
            </span>
            <h2 className="m-0 text-[28px] font-extrabold">{t('emptySavedTitle')}</h2>
            <p className="m-0 max-w-[460px] text-base leading-relaxed text-ink-3">{t('emptySavedText')}</p>
            <Link href={forYouHref} className={buttonClass('primary', 'md', 'mt-1.5 h-12 rounded-xl px-5 text-[15px] text-white hover:text-white')}>
                {t('emptySavedCta')}
            </Link>
        </section>
    )
}

// EmptyForYou is the « Pour toi » tab when the student's choices match nothing.
export function EmptyForYou({ allHref }: { allHref: string }) {
    const t = useTranslations('offers')
    return (
        <section className={cn(box, 'flex flex-col items-center gap-3.5 px-8 py-14 text-center')}>
            <h2 className="m-0 text-[28px] font-extrabold">{t('emptyForYouTitle')}</h2>
            <p className="m-0 max-w-[460px] text-base leading-relaxed text-ink-3">{t('emptyForYouText')}</p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
                <Link href="/preferences" className={buttonClass('primary', 'md', 'h-12 rounded-xl px-5 text-[15px] text-white hover:text-white')}>
                    {t('emptyForYouCta')}
                </Link>
                <Link href={allHref} className={buttonClass('secondary', 'md', 'h-12 rounded-xl px-5 text-[15px] text-ink hover:text-ink')}>
                    {t('emptyForYouAll')}
                </Link>
            </div>
        </section>
    )
}

export function SearchIllustration() {
    return (
        <svg width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
            <path d="M32 14h50l18 18v58a10 10 0 0 1-10 10H32a10 10 0 0 1-10-10V24a10 10 0 0 1 10-10z" fill="#fff" stroke="#101218" strokeWidth="2" />
            <path d="M82 14v12a6 6 0 0 0 6 6h12" fill="#D6F25E" stroke="#101218" strokeWidth="2" />
            <path d="M36 46h40M36 58h30M36 70h36" stroke="#DADDE3" strokeWidth="5" strokeLinecap="round" />
            <circle cx="98" cy="74" r="20" fill="#F4F9DD" stroke="#101218" strokeWidth="2.5" />
            <path d="m113 89 16 16" stroke="#101218" strokeWidth="5" strokeLinecap="round" />
        </svg>
    )
}

// EmptySearch is screen « aucun résultat »: what to remove to see topics again, with how many each would bring back.
export function EmptySearch({ query, relax }: { query: string; relax: { label: string; count: number; href: string }[] }) {
    const t = useTranslations('offers')
    return (
        <section className="flex flex-col items-center gap-4 px-6 pb-2 pt-10 text-center">
            <SearchIllustration />
            <h2 className="m-0 text-[30px] font-extrabold">{t('emptySearchTitle')}</h2>
            <p className="m-0 max-w-[540px] text-base leading-relaxed text-ink-3">{query ? t('emptySearchQuery', { q: query }) : t('emptySearchText')}</p>
            {relax.length ? (
                <div className="flex flex-wrap justify-center gap-2.5">
                    {relax.map((r) => (
                        <Link key={r.label} href={r.href} className="qf no-underline">
                            {r.label}&nbsp;<strong className="text-ink">{t('relaxCount', { count: r.count })}</strong>
                        </Link>
                    ))}
                </div>
            ) : null}
        </section>
    )
}
