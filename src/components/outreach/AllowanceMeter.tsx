'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'
import type { RecruiterAllowance } from '@/types/recruiter'

// AllowanceMeter shows the searches left today as a row of dots; limit null: no limit.
export default function AllowanceMeter({ allowance, loading, className }: { allowance?: RecruiterAllowance; loading: boolean; className?: string }) {
    const t = useTranslations('outreach')
    const limit = allowance?.limit ?? null
    const left = allowance ? (allowance.remaining ?? Math.max(0, (limit ?? 0) - allowance.used)) : 0
    return (
        <section className={cn('flex flex-col justify-center gap-2 rounded-[16px] border border-line-soft bg-white p-4', className)} aria-live="polite">
            <strong className="text-[15px]">{t('allowance.title')}</strong>
            {loading || !allowance ? (
                <span className="text-[13.5px] text-ink-3">{t('loading')}</span>
            ) : limit === null ? (
                <span className="text-[13.5px] text-ink-3">{t('allowance.unlimited')}</span>
            ) : (
                <>
                    <span className="flex flex-wrap gap-1.5" aria-hidden="true">
                        {Array.from({ length: limit }, (_, i) => (
                            <span key={i} className={cn('h-2.5 w-6 rounded-full', i < left ? 'bg-lime-deep' : 'bg-fill')} />
                        ))}
                    </span>
                    <span className="text-[13.5px] text-ink-2">
                        {left > 0 ? t('allowance.left', { left, limit }) : t('allowance.none')} · {t('allowance.resets')}
                    </span>
                </>
            )}
        </section>
    )
}
