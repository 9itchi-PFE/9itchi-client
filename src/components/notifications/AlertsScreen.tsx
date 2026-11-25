'use client'

import { useTranslations } from 'next-intl'
import { useSessionContext } from '@/components/auth/AuthProvider'
import { Sk } from '@/components/jobs/OfferStates'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAlertPreferences, useSetAlertPreference } from '@/hooks/useNotifications'
import { cn } from '@/lib/cn'
import type { AlertPreference } from '@/types/notification'

const eyebrow = 'font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3'
const main = 'mx-auto box-border flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 sm:px-8 pb-16 pt-8'
const cell = 'flex h-full items-center justify-center border-t border-fill py-3.5'

// Toggle is the on / off switch of one way of being told (email, in 9itchi) for one kind of alert.
function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (on: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={() => onChange(!on)}
            className={cn(
                'box-border flex h-[26px] w-11 flex-none cursor-pointer rounded-full border-0 p-[3px] transition-colors',
                on ? 'justify-end bg-ink' : 'justify-start bg-line-strong',
            )}
        >
            <span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)]" />
        </button>
    )
}

// AlertsScreen is « Paramètres → Alertes »: what 9itchi tells the student, by email and in the app.
export default function AlertsScreen() {
    const t = useTranslations('alerts')
    const tc = useTranslations('common')
    const toast = useToast()
    const { user } = useSessionContext()
    const prefs = useAlertPreferences()
    const save = useSetAlertPreference()

    if (prefs.isLoading) {
        return (
            <main aria-busy="true" className={main}>
                <Sk className="h-12 w-64 rounded-lg" />
                <Sk className="h-[340px] w-full rounded-[20px]" />
            </main>
        )
    }
    if (prefs.isError) {
        return (
            <main className={cn(main, 'items-start')}>
                <h1 className="m-0 text-[30px] sm:text-[40px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p role="alert" className="m-0 text-base text-ink-3">
                    {tc('error')}
                </p>
                <Button onClick={() => prefs.refetch()}>{tc('retry')}</Button>
            </main>
        )
    }

    const set = (next: AlertPreference) => save.mutate(next, { onError: () => toast(t('notSaved')) })
    return (
        <main className={main}>
            <div className="flex flex-col gap-1.5">
                <h1 className="m-0 text-[30px] sm:text-[40px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p className="m-0 text-[15px] text-ink-3">{t('intro')}</p>
            </div>
            <section className="flex flex-col gap-4 rounded-[20px] border border-line-soft bg-white p-6">
                <div role="table" aria-label={t('title')} className="grid grid-cols-[1fr_90px_90px] items-center">
                    <div role="row" className="contents">
                        <span role="columnheader">
                            <span className="sr-only">{t('colAlert')}</span>
                        </span>
                        <span role="columnheader" className={cn(eyebrow, 'pb-2 text-center')}>
                            {t('email')}
                        </span>
                        <span role="columnheader" className={cn(eyebrow, 'pb-2 text-center')}>
                            {t('inApp')}
                        </span>
                    </div>
                    {(prefs.data?.items ?? []).map((p) => (
                        <div role="row" key={p.kind} className="contents">
                            <span role="cell" className="flex flex-col gap-0.5 border-t border-fill py-3.5">
                                <strong className="text-[15px] font-semibold">{t(`kinds.${p.kind}.label`)}</strong>
                                <span className="text-[13px] text-ink-3">{t(`kinds.${p.kind}.desc`)}</span>
                            </span>
                            <span role="cell" className={cell}>
                                <Toggle on={p.email} label={t('byEmail', { alert: t(`kinds.${p.kind}.label`) })} onChange={(on) => set({ ...p, email: on })} />
                            </span>
                            <span role="cell" className={cell}>
                                <Toggle on={p.in_app} label={t('byApp', { alert: t(`kinds.${p.kind}.label`) })} onChange={(on) => set({ ...p, in_app: on })} />
                            </span>
                        </div>
                    ))}
                </div>
                {user?.email ? (
                    <p className="m-0 text-[13.5px] text-ink-3">
                        {t('goesTo')}{' '}
                        <span dir="ltr" className="font-medium text-ink-2">
                            {user.email}
                        </span>
                    </p>
                ) : null}
                <p className="m-0 text-[13.5px] leading-[1.55] text-ink-3">{t('always')}</p>
            </section>
        </main>
    )
}
