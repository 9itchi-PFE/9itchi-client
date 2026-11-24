'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, isLocale } from '@/i18n/locales'

const labels = { fr: 'FR', en: 'EN', ar: 'عربي' } as const

// LanguageSelect stores the choice in a cookie read by i18n/request.ts, then re-renders the page.
export default function LanguageSelect() {
    const t = useTranslations('header')
    const locale = useLocale()
    const router = useRouter()
    const [pending, start] = useTransition()
    return (
        <label>
            <span className="sr-only">{t('language')}</span>
            <select
                value={locale}
                disabled={pending}
                onChange={(e) => {
                    const next = e.target.value
                    if (!isLocale(next)) return
                    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
                    start(() => router.refresh())
                }}
                className="h-10 cursor-pointer rounded-full border border-line bg-white px-2.5 text-[13.5px] font-medium text-ink-2"
            >
                {Object.entries(labels).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
        </label>
    )
}
