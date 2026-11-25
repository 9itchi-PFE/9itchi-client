'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { useSessionContext } from '@/components/auth/AuthProvider'
import { useMe, useProfilePhoto } from '@/hooks/useAccount'

export const initials = (name?: string) =>
    (name ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || '9'

// AccountMenu is the avatar of the header; it keeps the pages that are not in the pill nav reachable.
export default function AccountMenu() {
    const t = useTranslations('header')
    const { user } = useSessionContext()
    const photo = useProfilePhoto(useMe().data?.has_photo).data
    const [open, setOpen] = useState(false)
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
    const item = 'block rounded-lg px-3 py-2 text-sm font-medium text-ink-2 no-underline hover:bg-fill hover:text-ink'
    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label={t('account')}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((o) => !o)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-[#E4DEFF] p-0 text-sm font-semibold text-violet-hover"
            >
                {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                    initials(user?.name)
                )}
            </button>
            {open ? (
                <div role="menu" className="absolute end-0 top-12 z-30 flex w-56 flex-col gap-0.5 rounded-2xl border border-line bg-white p-1.5 shadow-nav">
                    <Link role="menuitem" href="/dashboard" className={item} onClick={() => setOpen(false)}>
                        {t('dashboard')}
                    </Link>
                    <Link role="menuitem" href="/settings" className={item} onClick={() => setOpen(false)}>
                        {t('settings')}
                    </Link>
                    <Link role="menuitem" href="/settings/billing" className={item} onClick={() => setOpen(false)}>
                        {t('billing')}
                    </Link>
                    <Link role="menuitem" href="/support" className={item} onClick={() => setOpen(false)}>
                        {t('support')}
                    </Link>
                    <button role="menuitem" type="button" className={`${item} cursor-pointer border-0 bg-transparent text-start`} onClick={() => signOut()}>
                        {t('signOut')}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
