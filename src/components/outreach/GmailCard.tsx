'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { useGmailStatus, useRevokeGmail } from '@/hooks/useApplications'
import { cn } from '@/lib/cn'
import EmailService from '@/services/EmailService'

// GmailCard shows whether emails can leave from the student's Gmail and connects it. back is the page Google
// returns to (GmailScreen reads outreach_return).
export default function GmailCard({ back, className }: { back: string; className?: string }) {
    const t = useTranslations('outreach')
    const toast = useToast()
    const gmail = useGmailStatus()
    const revoke = useRevokeGmail()
    const [busy, setBusy] = useState(false)
    const connected = !!gmail.data?.connected

    const enable = async () => {
        setBusy(true)
        try {
            const { data } = await EmailService.connectGmail()
            sessionStorage.setItem('outreach_return', back)
            window.location.assign(data.url)
        } catch {
            setBusy(false)
            toast(t('unavailable'))
        }
    }

    return (
        <section className={cn('flex flex-wrap items-center gap-3 rounded-[16px] border border-line-soft bg-white p-4', className)}>
            <span className={cn('flex h-10 w-10 flex-none items-center justify-center rounded-xl', connected ? 'bg-ok-bg text-ok-fg' : 'bg-fill text-ink-2')}>
                <Icon name={connected ? 'check' : 'send'} />
            </span>
            <span className="flex min-w-0 flex-[1_1_180px] flex-col gap-0.5">
                <strong className="text-[15px]">{t('gmailTitle')}</strong>
                <span className="break-words text-[13.5px] text-ink-3">
                    {gmail.isLoading ? t('loading') : connected ? t('connectedAs', { email: gmail.data?.email ?? '' }) : t('notConnected')}
                </span>
            </span>
            {connected ? (
                <Button variant="ghost" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate()}>
                    {t('disable')}
                </Button>
            ) : (
                <Button size="sm" disabled={busy || gmail.isLoading} onClick={enable}>
                    {t('enable')}
                </Button>
            )}
        </section>
    )
}
