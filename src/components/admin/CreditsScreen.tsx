'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useIntegrations, useUpdateIntegration } from '@/hooks/useAdminIntegrations'
import { cn } from '@/lib/cn'
import type { Integration } from '@/types/statistics'
import { groupTotal, levelOf, parseQuota, type Level } from './credits'
import PoolSection from './PoolSection'
import { Kpi, apiError } from './SourcesScreen'

const card = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-5'
const tones: Record<Level, string> = { ok: 'bg-lime-deep', warn: 'bg-[#F79009]', high: 'bg-[#F04438]' }

function Meter({ percent, label }: { percent: number; label: string }) {
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(percent, 100)}
            className="h-3 overflow-hidden rounded-full bg-fill"
        >
            <div className={cn('h-full rounded-full', tones[levelOf(percent)])} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
    )
}

// CreditsScreen is « Crédits » : what the AI providers and plugins consumed this month against their quota,
// and where an admin replaces an API token without a deploy.
export default function CreditsScreen() {
    const t = useTranslations('admin')
    const locale = useLocale()
    const { data, isLoading, isError } = useIntegrations()
    const [editing, setEditing] = useState<Integration | null>(null)
    const n = (v: number) => new Intl.NumberFormat(locale).format(v)
    const items = data?.integrations ?? []
    const groups = [
        { kind: 'ai' as const, title: t('creditsAi'), note: t('creditsAiNote') },
        { kind: 'plugin' as const, title: t('creditsPlugins'), note: t('creditsPluginsNote') },
    ]
    const monthLabel = data
        ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${data.month}-01T00:00:00Z`))
        : ''

    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('creditsTitle')}</h1>
                <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('creditsSubtitle', { month: monthLabel })}</p>
            </div>
            {isError ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('creditsError')}
                </p>
            ) : null}
            <div aria-busy={isLoading} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {groups.map((g) => {
                        const sum = groupTotal(items, g.kind)
                        return (
                            <Kpi
                                key={g.kind}
                                label={g.title}
                                value={data ? (sum.percent === null ? '–' : `${sum.percent} %`) : undefined}
                                sub={sum.percent === null ? t('creditsNoQuota') : t('creditsGlobal', { used: n(sum.used), quota: n(sum.quota) })}
                            />
                        )
                    })}
                </div>
                {groups.map((g) => (
                    <section key={g.kind} aria-labelledby={`credits-${g.kind}`} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <h2 id={`credits-${g.kind}`} className="m-0 text-xl font-extrabold">
                                {g.title}
                            </h2>
                            <p className="m-0 text-[13.5px] text-ink-3">{g.note}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {items
                                .filter((i) => i.kind === g.kind)
                                .map((i) => (
                                    <article key={i.provider} className={card}>
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <h3 className="m-0 text-lg font-extrabold">{i.label}</h3>
                                                <span className="text-[13.5px] text-ink-3">
                                                    {i.has_token ? t('creditsToken', { hint: i.token_hint }) : t('creditsTokenEnv')}
                                                </span>
                                            </div>
                                            <Button variant="secondary" size="sm" onClick={() => setEditing(i)}>
                                                {t('creditsEdit')}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className={cn('flex min-w-0 flex-col gap-2', !i.balance && 'sm:col-span-2')}>
                                                {i.quota > 0 ? (
                                                    <>
                                                        <Meter percent={i.percent} label={i.label} />
                                                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[14.5px]">
                                                            <span>
                                                                <strong className="tabular-nums">{n(i.used)}</strong> / {n(i.quota)} {t(`unit_${i.unit}`)}
                                                            </span>
                                                            <strong className={cn('tabular-nums', levelOf(i.percent) === 'high' && 'text-[#B42318]')}>
                                                                {i.percent} %
                                                            </strong>
                                                        </div>
                                                        <span className="text-[13px] text-ink-3">
                                                            {t('creditsRemaining', { left: n(i.remaining), unit: t(`unit_${i.unit}`) })}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-[14.5px]">
                                                            {t.rich('creditsUsed', {
                                                                used: n(i.used),
                                                                unit: t(`unit_${i.unit}`),
                                                                b: (c) => <strong className="tabular-nums">{c}</strong>,
                                                            })}
                                                        </span>
                                                        <span className="text-[13px] text-ink-3">{t('creditsNoQuota')}</span>
                                                    </>
                                                )}
                                            </div>
                                            {i.balance ? <BalanceBox integration={i} balance={i.balance} /> : null}
                                        </div>
                                    </article>
                                ))}
                        </div>
                    </section>
                ))}
                <PoolSection integrations={items} />
            </div>
            {editing ? <IntegrationModal integration={editing} onClose={() => setEditing(null)} /> : null}
        </div>
    )
}

// BalanceBox is what is left on the provider account, read live by statistics-api: it covers every use of the key,
// not only 9itchi's, so it sits next to the month's 9itchi use rather than replacing it.
function BalanceBox({ integration, balance }: { integration: Integration; balance: NonNullable<Integration['balance']> }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const n = (v: number) => new Intl.NumberFormat(locale).format(v)
    const resets = balance.resets_on
        ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${balance.resets_on}T00:00:00Z`))
        : ''
    return (
        <div className="flex min-w-0 flex-col gap-1 rounded-[14px] bg-fill px-3.5 py-3">
            <span className="text-[14.5px]">
                {t.rich('creditsBalance', {
                    left: n(balance.left),
                    limit: n(balance.limit),
                    unit: t(`unit_${integration.unit}`),
                    b: (c) => <strong className="tabular-nums">{c}</strong>,
                })}
            </span>
            {resets ? <span className="text-[13px] text-ink-3">{t('creditsBalanceResets', { date: resets })}</span> : null}
            <span className="text-[13px] text-ink-3">{t('creditsBalanceNote', { name: integration.label })}</span>
        </div>
    )
}

// IntegrationModal sets the monthly quota and replaces (or removes) the API token. The token is write-only:
// the field starts empty and an empty field leaves the current token alone.
function IntegrationModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const update = useUpdateIntegration()
    const [quota, setQuota] = useState(integration.quota > 0 ? String(integration.quota) : '')
    const [token, setToken] = useState('')
    const [error, setError] = useState<string | null>(null)

    const send = (input: { quota?: number; token?: string }, done: string) =>
        update.mutate(
            { provider: integration.provider, input },
            {
                onSuccess: () => {
                    toast(done)
                    onClose()
                },
                onError: (err) => setError(apiError(err) ?? t('creditsSaveError')),
            },
        )

    const submit = (e: FormEvent) => {
        e.preventDefault()
        const q = parseQuota(quota)
        if (q === null) return setError(t('creditsQuotaInvalid'))
        const input: { quota?: number; token?: string } = {}
        const next = q === '' ? 0 : q
        if (next !== integration.quota) input.quota = next
        if (token.trim() !== '') input.token = token.trim()
        if (Object.keys(input).length === 0) return onClose()
        setError(null)
        send(input, t('creditsSaved', { name: integration.label }))
    }

    return (
        <Modal open onClose={onClose} title={t('creditsEditTitle', { name: integration.label })} width={520}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <Field
                    label={t('creditsQuotaLabel', { unit: t(`unit_${integration.unit}`) })}
                    inputMode="numeric"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    placeholder={t('creditsQuotaHint')}
                />
                <Field
                    label={t('creditsTokenLabel')}
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={integration.has_token ? integration.token_hint : t('creditsTokenPlaceholder')}
                />
                <p className="m-0 text-[13px] text-ink-3">{t('creditsTokenNote')}</p>
                {error ? (
                    <p role="alert" className="m-0 text-sm text-[#B42318]">
                        {error}
                    </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button type="submit" disabled={update.isPending}>
                        {t('creditsSave')}
                    </Button>
                    {integration.has_token ? (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="text-ink-3"
                            disabled={update.isPending}
                            onClick={() => send({ token: '' }, t('creditsTokenRemoved'))}
                        >
                            {t('creditsTokenRemove')}
                        </Button>
                    ) : null}
                </div>
            </form>
        </Modal>
    )
}
