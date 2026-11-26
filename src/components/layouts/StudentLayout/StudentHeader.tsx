'use client'

import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CountBadge } from '@/components/ui/CountBadge'
import { Icon, type IconName } from '@/components/ui/icons'
import { Logo } from '@/components/ui/Logo'
import { NotificationsContext } from '@/context/NotificationsContext'
import { useApplications } from '@/hooks/useApplications'
import { cn } from '@/lib/cn'
import AccountMenu from './AccountMenu'
import LanguageSelect from './LanguageSelect'

// also lists other sections a nav item stays active on (PFE books belong to Offres); not lists sub-pages that are
// items of their own (the email from a link under /outreach).
const nav: { key: 'jobs' | 'cv' | 'applications' | 'outreach' | 'outreachLink'; href: string; icon: IconName; also?: string[]; not?: string[] }[] = [
    { key: 'jobs', href: '/jobs', icon: 'briefcase', also: ['/books'] },
    { key: 'cv', href: '/resumes', icon: 'file' },
    { key: 'applications', href: '/applications', icon: 'send' },
    { key: 'outreach', href: '/outreach', icon: 'radar', not: ['/outreach/link'] },
    { key: 'outreachLink', href: '/outreach/link', icon: 'link' },
]

const countOf = (data: unknown): number | undefined => {
    if (Array.isArray(data)) return data.length
    const d = data as { total?: number; items?: unknown[] } | undefined
    return d?.total ?? d?.items?.length
}

// StudentHeader is the sticky header of the student pages: logo, pill nav, language, notifications, account.
export default function StudentHeader() {
    const t = useTranslations('header')
    const path = usePathname()
    const { unread } = useContext(NotificationsContext)
    const applications = countOf(useApplications().data)
    // On the CV editor the header slides away once the page is scrolled, to leave the room to the preview.
    const [scrolled, setScrolled] = useState(false)
    const editor = path.startsWith('/resumes')
    useEffect(() => {
        if (!editor) return setScrolled(false)
        const on = () => setScrolled(window.scrollY > 120)
        on()
        window.addEventListener('scroll', on, { passive: true })
        return () => window.removeEventListener('scroll', on)
    }, [editor])
    const under = (h: string) => path === h || path.startsWith(h + '/')
    const active = (n: (typeof nav)[number]) => [n.href, ...(n.also ?? [])].some(under) && !(n.not ?? []).some(under)
    return (
        <>
            <header
                className={cn(
                    'sticky top-0 z-20 bg-[rgba(250,250,249,.9)] backdrop-blur-[10px] transition-transform duration-200',
                    editor && scrolled && '-translate-y-full',
                )}
            >
                <div className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4 lg:py-3.5">
                    <Link href="/jobs" className="hit justify-self-start no-underline">
                        <Logo />
                    </Link>
                    {/* From a laptop up the sections sit in the header; on a phone they are the bar at the bottom. */}
                    <nav aria-label={t('mainNav')} className="hidden gap-0.5 rounded-full border border-line bg-white p-[5px] shadow-nav lg:flex">
                        {nav.map((n) => {
                            const on = active(n)
                            return (
                                <Link
                                    key={n.key}
                                    href={n.href}
                                    aria-current={on ? 'page' : undefined}
                                    className={cn(
                                        'flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[14.5px] no-underline xl:gap-2 xl:px-4',
                                        on ? 'bg-ink font-semibold text-white hover:text-white' : 'font-medium text-ink-2 hover:text-ink',
                                    )}
                                >
                                    <Icon name={n.icon} stroke={on ? '#D6F25E' : 'currentColor'} />
                                    {t(n.key)}
                                    {n.key === 'applications' && applications ? (
                                        <span className="rounded-full bg-fill px-[7px] py-px text-xs font-bold text-ink-2">{applications}</span>
                                    ) : null}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="flex items-center gap-2 justify-self-end sm:gap-2.5">
                        <LanguageSelect />
                        <Link
                            href="/notifications"
                            aria-label={unread ? t('notificationsUnread', { count: unread }) : t('notifications')}
                            className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-white text-ink-2"
                        >
                            <Icon name="bell" />
                            <CountBadge count={unread} label={t('notificationsUnread', { count: unread })} className="absolute -end-1 -top-1" />
                        </Link>
                        <AccountMenu />
                    </div>
                </div>
            </header>
            <nav
                aria-label={t('mainNav')}
                className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(16,24,40,.06)] lg:hidden"
            >
                {nav.map((n) => {
                    const on = active(n)
                    return (
                        <Link
                            key={n.key}
                            href={n.href}
                            aria-current={on ? 'page' : undefined}
                            className={cn(
                                'relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11.5px] leading-tight no-underline',
                                on ? 'font-semibold text-ink' : 'font-medium text-ink-3 hover:text-ink',
                            )}
                        >
                            <span className={cn('flex h-7 w-12 items-center justify-center rounded-full', on && 'bg-ink')}>
                                <Icon name={n.icon} stroke={on ? '#D6F25E' : 'currentColor'} />
                            </span>
                            <span className="max-w-full text-center leading-[1.15]">{t(n.key)}</span>
                            {n.key === 'applications' && applications ? (
                                <span className="absolute start-[calc(50%+14px)] top-1.5 rounded-full bg-violet px-[5px] text-[10px] font-bold leading-[16px] text-white">
                                    {applications}
                                </span>
                            ) : null}
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}
