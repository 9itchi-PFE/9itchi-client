'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { useMySubscription } from '@/hooks/usePlans'
import { renewal } from './billing'

// RenewalBanner tells the student, on every page, that their renewal is to pay: nothing is charged automatically,
// so without it the subscription would end without them noticing.
export default function RenewalBanner() {
    const t = useTranslations('billing')
    const format = useFormatter()
    const path = usePathname()
    const r = renewal(useMySubscription().data)
    if (!r || path.startsWith('/settings/billing')) return null
    return (
        <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-warn-bg px-4 py-2 text-sm text-warn-fg print:hidden">
            <span>
                {r.kind === 'due'
                    ? t('bannerDue', { count: r.days })
                    : t('bannerLapsed', { date: format.dateTime(new Date(r.endedAt), { day: 'numeric', month: 'long' }) })}
            </span>
            <Link href="/settings/billing" className="font-semibold text-warn-fg underline hover:text-warn-fg">
                {t('bannerAction')}
            </Link>
        </div>
    )
}
