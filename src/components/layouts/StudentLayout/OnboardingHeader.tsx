import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Icon } from '@/components/ui/icons'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'

// OnboardingHeader is the header of the sign-up steps (screens 1.2 to 1.3): logo and the three steps.
export default async function OnboardingHeader({ step }: { step: 1 | 2 | 3 }) {
    const t = await getTranslations('header')
    const steps = [t('stepAccount'), t('stepCv'), t('stepWishes')]
    return (
        <header className="mx-auto flex h-[68px] max-w-[1320px] flex-wrap items-center justify-between gap-6 px-8">
            <Link href="/jobs" className="no-underline">
                <Logo />
            </Link>
            <ol aria-label={t('steps')} className="m-0 flex list-none flex-wrap items-center gap-5 p-0">
                {steps.map((label, i) => {
                    const n = i + 1
                    const done = n < step
                    const on = n === step
                    return (
                        <li
                            key={label}
                            aria-current={on ? 'step' : undefined}
                            className={cn('flex items-center gap-2 text-sm', on ? 'font-semibold text-ink' : 'text-ink-3')}
                        >
                            <span
                                className={cn(
                                    'flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-semibold',
                                    done && 'bg-ok-bg text-ok-fg',
                                    on && 'bg-ink text-white',
                                    !done && !on && 'box-border border-[1.5px] border-line-input text-ink-3',
                                )}
                            >
                                {done ? <Icon name="check" size={13} strokeWidth={3} /> : n}
                            </span>
                            {label}
                        </li>
                    )
                })}
            </ol>
        </header>
    )
}
