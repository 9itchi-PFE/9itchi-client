import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Icon } from '@/components/ui/icons'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'

// OnboardingHeader is the header of the sign-up steps (screens 1.2 to 1.3): logo and the three steps.
// The last step is drawn as in screen 1.3: no PFE tag, a 72px bar, dark checks joined by short lines.
export default async function OnboardingHeader({ step }: { step: 1 | 2 | 3 }) {
    const t = await getTranslations('header')
    const steps = [t('stepAccount'), t('stepCv'), t('stepWishes')]
    const last = step === 3
    return (
        <header
            className={cn(
                'mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8',
                last ? 'min-h-[72px]' : 'min-h-[68px]',
            )}
        >
            <Link href="/jobs" className="no-underline">
                <Logo tag={!last} />
            </Link>
            <ol aria-label={t('steps')} className={cn('m-0 flex list-none flex-wrap items-center gap-y-1.5 p-0', last ? 'gap-x-2.5' : 'gap-x-5')}>
                {steps.map((label, i) => {
                    const n = i + 1
                    const done = n < step
                    const on = n === step
                    return [
                        last && i > 0 ? <li key={`${label}-line`} aria-hidden className="h-[1.5px] w-5 bg-ink" /> : null,
                        <li
                            key={label}
                            aria-current={on ? 'step' : undefined}
                            className={cn('flex items-center gap-2 text-sm', on ? 'font-semibold text-ink' : 'text-ink-3')}
                        >
                            <span
                                className={cn(
                                    'flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-semibold',
                                    done && !last && 'bg-ok-bg text-ok-fg',
                                    done && last && 'h-6 w-6 bg-ink text-lime',
                                    on && last && 'h-6 w-6',
                                    on && 'bg-ink text-white',
                                    !done && !on && 'box-border border-[1.5px] border-line-input text-ink-3',
                                )}
                            >
                                {done ? <Icon name="check" size={13} strokeWidth={3} /> : n}
                            </span>
                            {label}
                        </li>,
                    ]
                })}
            </ol>
        </header>
    )
}
