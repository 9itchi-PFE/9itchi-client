'use client'

import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Icon, type IconName } from '@/components/ui/icons'
import { Logo } from '@/components/ui/Logo'
import { NotificationsContext } from '@/context/NotificationsContext'
import { useApplications } from '@/hooks/useApplications'
import { cn } from '@/lib/cn'
import AccountMenu from './AccountMenu'
import LanguageSelect from './LanguageSelect'

// also lists other sections a nav item stays active on (PFE books belong to Offres).
const nav: { key: 'jobs' | 'cv' | 'applications'; href: string; icon: IconName; also?: string[] }[] = [
    { key: 'jobs', href: '/jobs', icon: 'briefcase', also: ['/books'] },
    { key: 'cv', href: '/resumes', icon: 'file' },
    { key: 'applications', href: '/applications', icon: 'send' },
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
    return (
        <header className={cn('sticky top-0 z-20 bg-[rgba(250,250,249,.9)] backdrop-blur-[10px] transition-transform duration-200', editor && scrolled && '-translate-y-full')}>
            <div className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-8 py-3.5">
                <Link href="/jobs" className="justify-self-start no-underline">
                    <Logo />
                </Link>
                <nav aria-label={t('mainNav')} className="flex gap-0.5 rounded-full border border-line bg-white p-[5px] shadow-nav">
                    {nav.map((n) => {
                        const on = [n.href, ...(n.also ?? [])].some((h) => path === h || path.startsWith(h + '/'))
                        return (
                            <Link
                                key={n.key}
                                href={n.href}
                                aria-current={on ? 'page' : undefined}
                                className={cn(
                                    'flex h-10 items-center gap-2 rounded-full px-4 text-[14.5px] no-underline',
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
                <div className="flex items-center gap-2.5 justify-self-end">
                    <LanguageSelect />
                    <Link
                        href="/notifications"
                        aria-label={unread ? t('notificationsUnread', { count: unread }) : t('notifications')}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-2"
                    >
                        <Icon name="bell" />
                        {unread ? <span className="absolute end-[9px] top-2 h-2 w-2 rounded-full border-2 border-white bg-violet" /> : null}
                    </Link>
                    <AccountMenu />
                </div>
            </div>
        </header>
    )
}
