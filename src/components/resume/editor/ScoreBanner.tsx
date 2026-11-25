'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ATSCheck } from '@/types/resume'

// ScoreBanner is the dark card above the editor: the score out of 24 and what is left to fix.
export default function ScoreBanner({ resumeId, check }: { resumeId: string; check?: ATSCheck }) {
    const t = useTranslations('cv')
    const tr = useTranslations('check.rules')
    const fixes = check?.rules.filter((r) => r.status === 'fix') ?? []
    const names = fixes.slice(0, 3).map((r) => tr(`${r.id}.short`))
    const hint = names.length ? names.join(', ').replace(/^./, (c) => c.toUpperCase()) + (fixes.length > 3 ? '…' : '') : ''
    // Every group hidden by the plan (no subscription): no score, the way to the subscription instead.
    const hidden = !!check && check.rules.length > 0 && check.rules.every((r) => r.status === 'locked')
    if (hidden) {
        return (
            <Link href="/settings/billing" className="flex items-center gap-4 rounded-2xl bg-ink px-[18px] py-4 text-white no-underline hover:text-white">
                <span className="flex h-14 w-14 flex-none items-center justify-center rounded-[14px] bg-lime font-display text-[22px] font-extrabold text-ink">
                    –
                </span>
                <span className="flex flex-1 flex-col gap-[3px]">
                    <strong className="text-[15px] font-semibold">{t('scorePlanTitle')}</strong>
                    <span className="text-[13.5px] text-[#B8BCC6]">{t('scorePlanText')}</span>
                </span>
                <span className="text-sm font-semibold text-lime">
                    {t('scorePlanCta')}{' '}
                    <span aria-hidden className="inline-block rtl:rotate-180">
                        →
                    </span>
                </span>
            </Link>
        )
    }
    return (
        <Link
            href={`/resumes/${resumeId}/check`}
            className="flex items-center gap-4 rounded-2xl bg-ink px-[18px] py-4 text-white no-underline hover:text-white"
        >
            <span className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-[14px] bg-lime text-ink">
                <span className="font-display text-[22px] font-extrabold leading-none">{check ? check.passed : '–'}</span>
                <span className="text-[10px] font-semibold">{t('scoreOf', { total: check?.total ?? 24 })}</span>
            </span>
            <span className="flex flex-1 flex-col gap-[3px]">
                <strong className="text-[15px] font-semibold">{t('scoreTitle', { count: check?.to_fix ?? 0 })}</strong>
                {hint ? <span className="text-[13.5px] text-[#B8BCC6]">{hint}</span> : null}
            </span>
            <span className="text-sm font-semibold text-lime">
                {t('scoreCheck')}{' '}
                <span aria-hidden className="inline-block rtl:rotate-180">
                    →
                </span>
            </span>
        </Link>
    )
}
