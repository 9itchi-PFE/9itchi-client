'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useMySubscription } from '@/hooks/usePlans'
import { premiumPlan } from '@/lib/badges'
import { planText } from './billing'

// PremiumBadge is the small lime pill beside a paid student's name; nothing for a free student.
export default function PremiumBadge() {
    const t = useTranslations('header')
    const locale = useLocale()
    const plan = premiumPlan(useMySubscription().data)
    if (!plan) return null
    const label = planText(plan, locale).label
    return (
        <span title={label} className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[11.5px] font-bold text-ink">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
            </svg>
            {t('premium')}
        </span>
    )
}
