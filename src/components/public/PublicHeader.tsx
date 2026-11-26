'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import LanguageSelect from '@/components/layouts/StudentLayout/LanguageSelect'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

// PublicHeader is the header of the pages anyone can open (home 7.1, shared offer 7.2): no account needed.
// signInTo is where signing in leads back to.
export default function PublicHeader({ signInTo }: { signInTo?: string }) {
    const t = useTranslations('public.nav')
    const signIn = signInTo ? `/auth/signin?callbackUrl=${encodeURIComponent(signInTo)}` : '/auth/signin'
    return (
        <header className="sticky top-0 z-20 bg-[rgba(250,250,249,.9)] backdrop-blur-[10px]">
            <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 sm:px-8 lg:py-3.5">
                <Link href="/" className="no-underline">
                    <Logo />
                </Link>
                <div className="ms-auto flex items-center gap-2">
                    <span className="hidden sm:inline-block">
                        <LanguageSelect remember={false} />
                    </span>
                    <Link href={signIn} className="hidden px-2 text-[14.5px] font-semibold text-ink no-underline hover:text-ink sm:inline">
                        {t('signIn')}
                    </Link>
                    <ButtonLink href="/auth/signup" size="sm" className="whitespace-nowrap">
                        {t('signUp')}
                    </ButtonLink>
                </div>
            </div>
        </header>
    )
}

// PublicFooter closes the public pages with the legal links and the contact address.
// PublicFooter closes the public pages: what 9itchi is, the ways in, the legal pages (terms, privacy, cookies,
// legal notice) and how to reach the team. On a phone the language is chosen here: the header has no room for it.
export function PublicFooter() {
    const t = useTranslations('public.footer')
    const year = new Date().getFullYear()
    const link = 'text-[14.5px] text-ink-2 no-underline hover:text-ink'
    const head = 'm-0 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-ink-3'
    return (
        <footer className="border-t border-line-soft bg-white">
            <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-12 sm:px-8 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
                <div className="flex flex-col gap-3">
                    <Link href="/" className="no-underline">
                        <Logo />
                    </Link>
                    <p className="m-0 max-w-[340px] text-[14.5px] leading-[1.55] text-ink-3">{t('about')}</p>
                </div>
                <nav aria-label={t('productTitle')} className="flex flex-col gap-2.5">
                    <h2 className={head}>{t('productTitle')}</h2>
                    <Link href="/auth/signup" className={link}>
                        {t('signUp')}
                    </Link>
                    <Link href="/auth/signin" className={link}>
                        {t('signIn')}
                    </Link>
                    <Link href="/auth/forgot-password" className={link}>
                        {t('forgot')}
                    </Link>
                </nav>
                <nav aria-label={t('legalTitle')} className="flex flex-col gap-2.5">
                    <h2 className={head}>{t('legalTitle')}</h2>
                    <Link href="/terms-conditions" className={link}>
                        {t('terms')}
                    </Link>
                    <Link href="/privacy-policy" className={link}>
                        {t('privacy')}
                    </Link>
                    <Link href="/cookies" className={link}>
                        {t('cookies')}
                    </Link>
                    <Link href="/terms-conditions#legal-notice" className={link}>
                        {t('notice')}
                    </Link>
                </nav>
                <div className="flex flex-col gap-2.5">
                    <h2 className={head}>{t('contactTitle')}</h2>
                    <a href="mailto:contact@9itchi-pfe.com" className={link} dir="ltr">
                        contact@9itchi-pfe.com
                    </a>
                    <span className="text-[14.5px] text-ink-3">{t('place')}</span>
                </div>
            </div>
            <div className="border-t border-line-soft">
                <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-[13.5px] text-ink-3 sm:px-8">
                    <span>{t('copyright', { year })}</span>
                    <span className="sm:hidden">
                        <LanguageSelect remember={false} />
                    </span>
                </div>
            </div>
        </footer>
    )
}
