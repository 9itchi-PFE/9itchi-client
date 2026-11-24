'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

// ShowSwitch is the eye toggle used everywhere something can be shown on or hidden from the CV.
export default function ShowSwitch({ shown, label, onChange }: { shown: boolean; label: string; onChange: (shown: boolean) => void }) {
    const t = useTranslations('cv')
    return (
        <button
            type="button"
            role="switch"
            aria-checked={shown}
            aria-label={label}
            title={label}
            onClick={() => onChange(!shown)}
            className={cn(
                'inline-flex h-10 flex-none cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-[13.5px] font-semibold transition-colors',
                shown ? 'border-ok-dot bg-ok-bg text-ok-fg hover:brightness-95' : 'border-line-strong bg-fill-3 text-ink-3 hover:bg-fill-2',
            )}
        >
            <Icon name={shown ? 'eye' : 'eyeOff'} size={18} />
            {shown ? t('visibleBadge') : t('hiddenBadge')}
        </button>
    )
}
