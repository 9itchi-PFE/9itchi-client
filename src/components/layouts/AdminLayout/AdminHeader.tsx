'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useSessionContext } from '@/components/auth/AuthProvider'
import { SignOutDialog } from '@/components/auth/SignOutDialog'
import { useChatBadge } from '@/components/chat/useLiveChat'
import { CountBadge } from '@/components/ui/CountBadge'
import { Logo } from '@/components/ui/Logo'
import { useReviewList } from '@/hooks/useAdminJobs'
import { useTitleCount } from '@/hooks/useTitleCount'
import { cn } from '@/lib/cn'
import { initials } from '../StudentLayout/AccountMenu'
import LanguageSelect from '../StudentLayout/LanguageSelect'

type Key = 'navHome' | 'navOffers' | 'navBooks' | 'navStudents' | 'navPlans' | 'navSupport' | 'navStats' | 'navSources' | 'navTemplates'

// exact keeps Accueil from lighting up on every admin page; also lists other sections an item stays active on.
const nav: { key: Key; href: string; exact?: boolean; also?: string[] }[] = [
    { key: 'navHome', href: '/admin', exact: true },
    { key: 'navOffers', href: '/admin/jobs' },
    { key: 'navBooks', href: '/admin/books' },
    { key: 'navStudents', href: '/admin/users' },
    { key: 'navPlans', href: '/admin/plans', also: ['/admin/promo-codes'] },
    { key: 'navSupport', href: '/admin/support' },
    { key: 'navStats', href: '/admin/stats' },
    { key: 'navSources', href: '/admin/sources' },
    { key: 'navTemplates', href: '/admin/templates' },
]

export const isActive = (path: string, n: { href: string; exact?: boolean; also?: string[] }) =>
    n.exact ? path === n.href : [n.href, ...(n.also ?? [])].some((h) => path === h || path.startsWith(h + '/'))

function AdminAccount() {
    const t = useTranslations('admin')
    const { user } = useSessionContext()
    const [open, setOpen] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!open) return
        const close = (e: MouseEvent | KeyboardEvent) => {
            if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', close)
        document.addEventListener('keydown', close)
        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('keydown', close)
        }
    }, [open])
    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label={t('team')}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((o) => !o)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-sm font-bold text-lime"
            >
                {initials(user?.name)}
            </button>
            {open ? (
                <div role="menu" className="absolute end-0 top-[52px] z-30 flex w-56 flex-col gap-0.5 rounded-2xl border border-line bg-white p-1.5 shadow-nav">
                    <span className="truncate px-3 py-2 text-xs text-ink-3">{user?.email ?? t('team')}</span>
                    <button
                        role="menuitem"
                        type="button"
                        className="block cursor-pointer rounded-lg border-0 bg-transparent px-3 py-2 text-start text-sm font-medium text-ink-2 hover:bg-fill hover:text-ink"
                        onClick={() => {
                            setOpen(false)
                            setLeaving(true)
                        }}
                    >
                        {t('signOut')}
                    </button>
                </div>
            ) : null}
            <SignOutDialog open={leaving} onClose={() => setLeaving(false)} />
        </div>
    )
}

// AdminHeader is the sticky header of the admin pages: logo with the ADMIN tag, pill nav, account.
export default function AdminHeader() {
    const t = useTranslations('admin')
    const th = useTranslations('header')
    const path = usePathname()
    const pending = useReviewList('pending').data?.counts?.pending
    const chatUnread = useChatBadge()
    useTitleCount(chatUnread)
    // Under 1280px the sections scroll sideways: bring the current one into view so it is never hidden off the edge.
    const bar = useRef<HTMLElement>(null)
    useEffect(() => {
        bar.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
    }, [path])
    return (
        <header className="sticky top-0 z-20 bg-[rgba(242,243,245,.9)] backdrop-blur-[10px]">
            <div className="mx-auto flex max-w-[1376px] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3.5 sm:px-8">
                <Link href="/admin" className="hit me-auto no-underline">
                    <Logo tag="ADMIN" />
                </Link>
                {/* Under 1280px the sections take their own line and scroll sideways; the language and the account stay
                    beside the logo. */}
                <div className="contents">
                    <nav
                        ref={bar}
                        aria-label={t('nav')}
                        className="scroll-hint-x order-last flex basis-full gap-0.5 overflow-x-auto rounded-full border border-line bg-white p-[5px] shadow-nav xl:order-none xl:basis-auto"
                    >
                        {nav.map((n) => {
                            const on = isActive(path, n)
                            return (
                                <Link
                                    key={n.key}
                                    href={n.href}
                                    aria-current={on ? 'page' : undefined}
                                    className={cn(
                                        'flex h-9 flex-none items-center gap-2 whitespace-nowrap rounded-full px-3 text-[13.5px] no-underline',
                                        on ? 'bg-ink font-semibold text-white hover:text-white' : 'font-medium text-ink-2 hover:text-ink',
                                    )}
                                >
                                    {t(n.key)}
                                    {n.key === 'navOffers' && pending ? (
                                        <span className="rounded-full bg-lime px-[7px] py-px text-xs font-bold text-ink">{pending}</span>
                                    ) : null}
                                    {n.key === 'navSupport' ? <CountBadge count={chatUnread} label={th('messagesUnread', { count: chatUnread })} /> : null}
                                </Link>
                            )
                        })}
                    </nav>
                    <LanguageSelect />
                    <AdminAccount />
                </div>
            </div>
        </header>
    )
}
