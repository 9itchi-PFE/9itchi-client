'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { Sk } from '@/components/jobs/OfferStates'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { useGmailStatus, useRevokeGmail } from '@/hooks/useApplications'
import EmailService from '@/services/EmailService'
import { pendingJob } from './apply'

const outcomes = ['connected', 'denied', 'error'] as const
type Outcome = (typeof outcomes)[number]

// GmailScreen is where Google sends the browser back, and where the student connects or disconnects Gmail.
export default function GmailScreen() {
    const t = useTranslations('gmail')
    const format = useFormatter()
    const router = useRouter()
    const params = useSearchParams()
    const toast = useToast()
    const status = useGmailStatus()
    const revoke = useRevokeGmail()
    const [busy, setBusy] = useState(false)
    const [returning, setReturning] = useState(false)

    const outcome = outcomes.find((o) => o === params.get('gmail')) as Outcome | undefined
    useEffect(() => {
        if (!outcome) return
        // The student left for Google in the middle of an application: take them back to their letter.
        const job = pendingJob()
        if (job) {
            setReturning(true)
            router.replace(`/jobs/${job}/apply?gmail=${outcome}`)
            return
        }
        toast(t(outcome))
        if (sessionStorage.getItem('outreach_return')) {
            sessionStorage.removeItem('outreach_return')
            router.replace('/outreach')
            return
        }
        router.replace('/settings/gmail')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [outcome])

    const connect = async () => {
        setBusy(true)
        try {
            const { data } = await EmailService.connectGmail()
            window.location.assign(data.url)
        } catch {
            setBusy(false)
            toast(t('unavailable'))
        }
    }
    const disconnect = () => {
        if (!window.confirm(t('disconnectConfirm'))) return
        revoke.mutate(undefined, { onSuccess: () => toast(t('disconnected')), onError: () => toast(t('unavailable')) })
    }

    if (returning) {
        return (
            <main className="mx-auto box-border flex w-full max-w-[760px] flex-1 flex-col gap-4 px-4 sm:px-8 pb-16 pt-12">
                <p role="status" className="m-0 text-base text-ink-3">
                    {t('backToLetter')}
                </p>
            </main>
        )
    }
    const s = status.data
    return (
        <main className="mx-auto box-border flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 sm:px-8 pb-16 pt-8">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[30px] sm:text-[40px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p className="m-0 text-base leading-[1.55] text-ink-3">{t('intro')}</p>
            </div>
            <section className="flex flex-col gap-4 rounded-[20px] border border-line-soft bg-white p-6">
                <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-line-soft p-4">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-fill">
                        <Icon name="send" />
                    </span>
                    <span className="flex min-w-0 flex-[1_1_170px] flex-col gap-0.5">
                        <strong className="text-[15px]">Gmail</strong>
                        {status.isLoading ? (
                            <Sk className="h-4 w-48 rounded" />
                        ) : (
                            <span className="truncate text-[13.5px] text-ink-3">
                                {s?.connected
                                    ? [
                                          t('connectedAs', { email: s.email ?? '' }),
                                          s.connected_at
                                              ? t('since', {
                                                    date: format.dateTime(new Date(s.connected_at), { day: 'numeric', month: 'long', year: 'numeric' }),
                                                })
                                              : '',
                                      ]
                                          .filter(Boolean)
                                          .join(' · ')
                                    : t('notConnected')}
                            </span>
                        )}
                    </span>
                    {s?.connected ? (
                        <Button variant="secondary" size="sm" className="h-10 px-3.5 text-sm" disabled={revoke.isPending} onClick={disconnect}>
                            {t('disconnect')}
                        </Button>
                    ) : (
                        <Button size="sm" className="h-10 px-4 text-sm" disabled={busy || status.isLoading} onClick={connect}>
                            {t('connect')}
                        </Button>
                    )}
                </div>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[14.5px] leading-[1.5] text-ink-2">
                    {(['point1', 'point2', 'point3'] as const).map((k) => (
                        <li key={k} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-lime text-[11px] font-bold">✓</span>
                            {t(k)}
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    )
}
