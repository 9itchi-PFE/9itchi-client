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
                <nav aria-label={t('label')} className="ms-6 hidden items-center gap-5 md:flex">
                    <Link href="/#how" className="text-[14.5px] font-medium text-ink-2 no-underline hover:text-ink">
                        {t('how')}
                    </Link>
                    <Link href="/#pricing" className="text-[14.5px] font-medium text-ink-2 no-underline hover:text-ink">
                        {t('pricing')}
                    </Link>
                </nav>
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
export function PublicFooter() {
    const t = useTranslations('public')
    return (
        <footer className="border-t border-line-soft">
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-ink-3 sm:px-8">
                <span className="font-semibold text-ink">9itchi PFE</span>
                {/* On a phone the language is chosen here: the header has no room for it. */}
                <span className="sm:hidden">
                    <LanguageSelect remember={false} />
                </span>
                <Link href="/terms-conditions" className="text-ink-3 no-underline hover:text-ink">
                    {t('footTerms')}
                </Link>
                <Link href="/privacy-policy" className="text-ink-3 no-underline hover:text-ink">
                    {t('footPrivacy')}
                </Link>
                <a href="mailto:contact@9itchi-pfe.com" className="text-ink-3 no-underline hover:text-ink" dir="ltr">
                    contact@9itchi-pfe.com
                </a>
            </div>
        </footer>
    )
}
