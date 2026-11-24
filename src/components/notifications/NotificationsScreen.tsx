'use client'

import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { CompanyBadge } from '@/components/jobs/OfferCard'
import { Sk } from '@/components/jobs/OfferStates'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/cn'
import type { Notification } from '@/types/notification'
import { describe, split, when, type Glyph } from './notifications'

const main = 'mx-auto box-border flex w-full max-w-[820px] flex-1 flex-col gap-[22px] px-8 pb-[72px] pt-4'
const eyebrow = 'font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3'
const tile = 'flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl text-[13px] font-bold'

function Tile({ glyph }: { glyph: Glyph }) {
    if (glyph.kind === 'company') return <CompanyBadge company={glyph.company} size={42} className="rounded-xl text-[13px]" />
    if (glyph.kind === 'count')
        return (
            <span aria-hidden className={cn(tile, 'bg-lime')}>
                {glyph.count > 99 ? '99+' : glyph.count}
            </span>
        )
    if (glyph.kind === 'alert')
        return (
            <span aria-hidden className={cn(tile, 'bg-warn-bg text-warn-fg')}>
                !
            </span>
        )
    return (
        <span aria-hidden className={cn(tile, 'bg-fill text-ink-2')}>
            <Icon name="bell" size={18} />
        </span>
    )
}

function Row({ n, onOpen }: { n: Notification; onOpen: (id: string) => void }) {
    const t = useTranslations('notifications')
    const format = useFormatter()
    const s = describe(n)
    const w = when(n.created_at)
    const time = format.dateTime(w.at, { hour: '2-digit', minute: '2-digit' })
    const date = w.kind === 'today' ? t('today', { time }) : w.kind === 'yesterday' ? t('yesterday') : format.dateTime(w.at, { day: 'numeric', month: 'short' })
    return (
        <li
            className={cn(
                'flex items-center gap-3.5 border-b border-fill px-[18px] py-4 last:border-b-0',
                n.read ? 'bg-white' : 'bg-violet-tint shadow-[inset_3px_0_0_#4B32E0] rtl:shadow-[inset_-3px_0_0_#4B32E0]',
            )}
        >
            <Tile glyph={s.glyph} />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[15px] leading-[1.45]">
                    {n.read ? null : <span className="sr-only">{t('new')} </span>}
                    {/* Each part is isolated: a French offer title after an Arabic sentence keeps its own order. The
                        sentence keeps the direction of the page even when it starts with a company name. */}
                    <strong className="font-semibold [unicode-bidi:isolate]">{s.title === 'raw' ? s.raw : t(s.title, s.values)}</strong>
                    {s.detail ? (
                        <>
                            {' '}
                            <bdi className="text-ink-2">{s.detail}</bdi>
                        </>
                    ) : null}
                </span>
                <time dateTime={n.created_at} className="text-[13px] text-ink-3">
                    {date}
                </time>
            </div>
            {s.action ? (
                <ButtonLink href={s.href} size="sm" variant={s.urgent && !n.read ? 'primary' : 'secondary'} className="flex-none" onClick={() => onOpen(n.id)}>
                    {t(s.action)}
                </ButtonLink>
            ) : n.read ? null : (
                <Button size="sm" variant="secondary" className="flex-none" onClick={() => onOpen(n.id)}>
                    {t('markRead')}
                </Button>
            )}
        </li>
    )
}

// Empty is screen EmptyNotifications: nothing was told yet.
function Empty() {
    const t = useTranslations('notifications')
    return (
        <main className={main}>
            <h1 className="m-0 text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
            <section className="flex flex-col items-center gap-3.5 rounded-3xl border border-line-soft bg-white px-8 py-14 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-fill">
                    <Icon name="bell" size={28} />
                </span>
                <h2 className="m-0 text-[28px] font-extrabold">{t('emptyTitle')}</h2>
                <p className="m-0 max-w-[460px] text-base leading-[1.6] text-ink-3">{t('emptyText')}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2.5">
                    <ButtonLink href="/settings/alerts" variant="secondary" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('chooseEmails')}
                    </ButtonLink>
                    <ButtonLink href="/jobs" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('backToOffers')}
                    </ButtonLink>
                </div>
            </section>
        </main>
    )
}

// NotificationsScreen lists what 9itchi told the student, the new ones first, each with the page it leads to.
export default function NotificationsScreen() {
    const t = useTranslations('notifications')
    const tc = useTranslations('common')
    const list = useNotifications()
    const markRead = useMarkRead()
    const markAll = useMarkAllRead()

    if (list.isLoading) {
        return (
            <main aria-busy="true" className={main}>
                <Sk className="h-12 w-80 rounded-lg" />
                <Sk className="h-40 w-full rounded-[18px]" />
                <Sk className="h-40 w-full rounded-[18px]" />
            </main>
        )
    }
    if (list.isError) {
        return (
            <main className={cn(main, 'items-start')}>
                <h1 className="m-0 text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p role="alert" className="m-0 text-base text-ink-3">
                    {tc('error')}
                </p>
                <Button onClick={() => list.refetch()}>{tc('retry')}</Button>
            </main>
        )
    }
    const items = list.data?.items ?? []
    if (items.length === 0) return <Empty />

    const unread = list.data?.unread_count ?? 0
    const { fresh, earlier } = split(items)
    const groups = [
        { key: 'fresh', label: t('groupNew'), items: fresh },
        { key: 'earlier', label: t('groupEarlier'), items: earlier },
    ].filter((g) => g.items.length > 0)
    return (
        <main className={main}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <h1 className="m-0 text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
                    <span role="status" className="text-[15px] text-ink-3">
                        {unread ? t('unread', { count: unread }) : t('allRead')}
                    </span>
                </div>
                {unread ? (
                    <Button variant="secondary" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
                        {t('markAllRead')}
                    </Button>
                ) : null}
            </div>
            {groups.map((g) => (
                <section key={g.key} className="flex flex-col gap-2.5" aria-labelledby={`notif-${g.key}`}>
                    <h2 id={`notif-${g.key}`} className={cn(eyebrow, 'm-0')}>
                        {g.label}
                    </h2>
                    <ul className="m-0 list-none overflow-hidden rounded-[18px] border border-line-soft bg-white p-0">
                        {g.items.map((n) => (
                            <Row key={n.id} n={n} onOpen={(id) => !n.read && markRead.mutate(id)} />
                        ))}
                    </ul>
                </section>
            ))}
            <p className="m-0 text-[13.5px] text-ink-3">
                {t.rich('alsoByEmail', {
                    link: (chunks) => (
                        <Link href="/settings/alerts" className="font-semibold">
                            {chunks}
                        </Link>
                    ),
                })}
            </p>
        </main>
    )
}
