'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, isLocale } from '@/i18n/locales'
import AccountService from '@/services/AccountService'

const labels = { fr: 'FR', en: 'EN', ar: 'عربي' } as const
const flags = { fr: 'FR', en: 'UK', ar: 'SA' } as const

// LanguageSelect stores the choice in a cookie read by i18n/request.ts, then re-renders the page. It also tells
// account-api, so that the emails 9itchi sends are written in the same language; the page does not wait for it.
export default function LanguageSelect() {
    const t = useTranslations('header')
    const locale = useLocale()
    const router = useRouter()
    const [pending, start] = useTransition()
    return (
        <label className="relative inline-block">
            <img
                src={`/img/countries/${flags[locale as keyof typeof flags] ?? 'FR'}.png`}
                alt=""
                width={20}
                height={20}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 rounded-full object-cover"
            />
            <span className="sr-only">{t('language')}</span>
            <select
                value={locale}
                disabled={pending}
                onChange={(e) => {
                    const next = e.target.value
                    if (!isLocale(next)) return
                    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
                    AccountService.setLanguage(next).catch(() => {
                        /* The interface changes anyway; the emails keep the previous language until the next change. */
                    })
                    start(() => router.refresh())
                }}
                className="h-10 cursor-pointer rounded-full border border-line bg-white ps-9 pe-2.5 text-[13.5px] font-medium text-ink-2"
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
