'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/icons'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { SEARCH_STEPS, searchStep } from './outreach'

// SearchProgress shows the steps of a running search, one after the other by time (email-api answers once, at the
// end): the last step stays until the answer.
export default function SearchProgress() {
    const t = useTranslations('outreach.progress')
    const [step, setStep] = useState(0)
    useEffect(() => {
        const start = Date.now()
        const id = setInterval(() => setStep(searchStep(Date.now() - start)), 500)
        return () => clearInterval(id)
    }, [])

    return (
        <section aria-label={t('title')} aria-live="polite" className="flex flex-col gap-3 rounded-[20px] border border-line-soft bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3">
                <Spinner label={t('title')} size={32} />
                <strong className="text-[15px]">{t('title')}</strong>
            </div>
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {SEARCH_STEPS.map((s, i) => (
                    <li
                        key={s.key}
                        aria-current={i === step ? 'step' : undefined}
                        className={cn('flex items-center gap-2 text-[14px]', i < step ? 'text-ink-3' : i === step ? 'font-semibold text-ink' : 'text-ink-4')}
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                'flex h-6 w-6 flex-none items-center justify-center rounded-full text-[12px]',
                                i < step ? 'bg-ok-bg text-ok-fg' : i === step ? 'bg-ink text-lime' : 'bg-fill text-ink-4',
                            )}
                        >
                            {i < step ? <Icon name="check" size={14} /> : i + 1}
                        </span>
                        {t(s.key)}
                    </li>
                ))}
            </ol>
        </section>
    )
}
