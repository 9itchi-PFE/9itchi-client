import { cn } from '@/lib/cn'

// Segmented is the grey pill switch used for tabs and toggles (Versions/Historique, FR/EN, À corriger/Toutes).
export function Segmented<T extends string>({
    value,
    options,
    onChange,
    label,
    role = 'tablist',
    className,
    itemClassName,
}: {
    value: T
    options: { value: T; label: string; disabled?: boolean; title?: string }[]
    onChange: (v: T) => void
    label: string
    role?: 'tablist' | 'radiogroup'
    className?: string
    itemClassName?: string
}) {
    return (
        <div role={role} aria-label={label} className={cn('flex gap-0.5 rounded-xl bg-[#EFF0F2] p-[3px]', className)}>
            {options.map((o) => {
                const on = o.value === value
                return (
                    <button
                        key={o.value}
                        type="button"
                        role={role === 'tablist' ? 'tab' : 'radio'}
                        aria-selected={role === 'tablist' ? on : undefined}
                        aria-checked={role === 'radiogroup' ? on : undefined}
                        disabled={o.disabled}
                        title={o.title}
                        onClick={() => onChange(o.value)}
                        className={cn(
                            'h-9 cursor-pointer rounded-[9px] border-0 px-3 text-[13.5px] font-semibold disabled:cursor-not-allowed',
                            on ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,.1)]' : 'bg-transparent text-ink-3',
                            itemClassName,
                        )}
                    >
                        {o.label}
                    </button>
                )
            })}
        </div>
    )
}
