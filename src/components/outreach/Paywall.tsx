'use client'

import { useTranslations } from 'next-intl'
import { ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'

// Paywall is what a 402 shows: the feature is part of the subscription ('plan'), or its limit is used ('used').
export default function Paywall({ reason, what }: { reason: 'plan' | 'used'; what: 'search' | 'draft' | 'send' }) {
    const t = useTranslations('outreach.paywall')
    return (
        <div role="note" className="flex flex-wrap items-center gap-3 rounded-[16px] border border-ink bg-lime-soft p-4">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-ink text-lime">
                <Icon name="lock" />
            </span>
            <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                <strong className="text-[15px]">{t(`${what}.${reason}Title`)}</strong>
                <span className="text-[13.5px] text-ink-2">{t(`${what}.${reason}Text`)}</span>
            </span>
            {reason === 'plan' ? (
                <ButtonLink href="/settings/billing" size="sm">
                    {t('subscribe')}
                </ButtonLink>
            ) : null}
        </div>
    )
}
