'use client'

import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { dinars, months } from '@/components/billing/billing'
import { Button } from '@/components/ui/Button'
import { Field, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAllPlans, useDeletePromo, usePromos, useSavePlan, useSavePromo, useSaveReceiptIssuer } from '@/hooks/useAdminPlans'
import { useReceiptIssuer } from '@/hooks/usePlans'
import { cn } from '@/lib/cn'
import type { Plan, PromoCode } from '@/types/plan'
import { apiError } from './SourcesScreen'
import { FREE_PLAN, dayOf, planInput, promoInput, promoState, quotaKeys, stopped, type PromoState } from './plans'

const KNOWN_QUOTAS = ['resumes', 'cv_downloads', 'emails_per_month'] as const
const isKnown = (k: string): k is (typeof KNOWN_QUOTAS)[number] => (KNOWN_QUOTAS as readonly string[]).includes(k)

const pill: Record<PromoState, string> = {
    active: 'bg-ok-bg text-ok-fg',
    upcoming: 'bg-violet-soft text-violet-hover',
    expired: 'bg-fill text-ink-3',
    usedUp: 'bg-fill text-ink-3',
}

const card = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-5'
const head = 'rounded-[10px] bg-fill-3 py-2.5 text-[13px] font-semibold text-ink-3'
const line = 'border-b border-line-soft py-3.5 text-[14.5px]'

function Problem({ children }: { children: string }) {
    return children ? (
        <p role="alert" className="m-0 text-sm text-[#B42318]">
            {children}
        </p>
    ) : null
}

// PlanCard is one paid plan: what it normally costs (struck through for students) and what is charged.
function PlanCard({ plan }: { plan: Plan }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const toast = useToast()
    const save = useSavePlan()
    const [error, setError] = useState('')
    const m = months(plan.duration_days)
    const period = m === 1 ? t('perMonth') : m ? t('perMonths', { count: m }) : t('perDays', { count: plan.duration_days })

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const built = planInput(plan, { price: String(f.get('price')), regular: String(f.get('regular')) })
        if ('error' in built) return setError(t(built.error))
        setError('')
        save.mutate(
            { id: plan.id, input: built.input },
            { onSuccess: () => toast(t('planSaved')), onError: (err) => setError(apiError(err) ?? t('stateError')) },
        )
    }
    return (
        <section aria-labelledby={`plan-${plan.id}`} className={cn(card, 'border-[1.5px] border-ink shadow-card')}>
            <div className="flex items-center justify-between gap-3">
                <h2 id={`plan-${plan.id}`} className="m-0 text-xl font-extrabold">
                    {plan.name}
                </h2>
                {plan.active ? null : <span className="rounded-full bg-fill px-2.5 py-[3px] text-[13px] font-semibold text-ink-3">{t('planOff')}</span>}
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field
                        name="regular"
                        label={t('regularPrice', { period })}
                        inputMode="decimal"
                        dir="ltr"
                        defaultValue={plan.regular_price ? dinars(plan.regular_price, 'en').replace(/,/g, '') : ''}
                        placeholder={t('regularNone')}
                    />
                    <Field
                        name="price"
                        label={t('launchPrice', { period })}
                        inputMode="decimal"
                        dir="ltr"
                        required
                        defaultValue={dinars(plan.price, 'en').replace(/,/g, '')}
                    />
                </div>
                <Problem>{error}</Problem>
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="secondary" disabled={save.isPending}>
                        {t('save')}
                    </Button>
                    <span className="text-[13px] text-ink-3">
                        {plan.regular_price
                            ? t('priceHintBoth', { price: dinars(plan.price, locale), regular: dinars(plan.regular_price, locale) })
                            : t('priceHintOne', { price: dinars(plan.price, locale) })}
                    </span>
                </div>
            </form>
        </section>
    )
}

function PromoModal({ promo, onClose }: { promo: PromoCode | null | undefined; onClose: () => void }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const save = useSavePromo()
    const remove = useDeletePromo()
    const [error, setError] = useState('')
    if (promo === undefined) return null

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const get = (k: string) => String(f.get(k) ?? '')
        const built = promoInput(
            { code: get('code'), type: get('type'), value: get('value'), from: get('from'), until: get('until'), limit: get('limit') },
            promo?.plan_ids ?? [],
        )
        if ('error' in built) return setError(t(built.error))
        setError('')
        save.mutate(
            { id: promo?.id, input: built.input },
            {
                onSuccess: () => {
                    toast(t('promoSaved'))
                    onClose()
                },
                onError: (err) => setError(isAxiosError(err) && err.response?.status === 409 ? t('promoDuplicate') : (apiError(err) ?? t('stateError'))),
            },
        )
    }
    const del = () => {
        if (!promo || !window.confirm(t('promoDeleteConfirm', { code: promo.code }))) return
        remove.mutate(promo.id, {
            onSuccess: () => {
                toast(t('promoDeleted'))
                onClose()
            },
            onError: (err) => setError(apiError(err) ?? t('stateError')),
        })
    }
    return (
        <Modal open onClose={onClose} title={promo ? t('promoEdit') : t('promoAdd')} width={560}>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                    <Field
                        name="code"
                        label={t('pCode')}
                        required
                        minLength={3}
                        maxLength={64}
                        dir="ltr"
                        className="font-mono uppercase"
                        defaultValue={promo?.code}
                    />
                    <span className="text-[12.5px] text-ink-3">{t('pCodeHint')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                        {t('pType')}
                        <select name="type" defaultValue={promo?.type ?? 'fixed'} className={inputClass}>
                            <option value="fixed">{t('pFixed')}</option>
                            <option value="percentage">{t('pPercent')}</option>
                        </select>
                    </label>
                    <Field name="value" label={t('pValue')} required inputMode="decimal" dir="ltr" defaultValue={promo ? String(promo.value) : ''} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field name="from" type="date" label={t('pFrom')} required dir="ltr" defaultValue={dayOf(promo?.valid_from ?? new Date().toISOString())} />
                    <Field name="until" type="date" label={t('pUntil')} required dir="ltr" defaultValue={promo ? dayOf(promo.valid_until) : ''} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Field name="limit" label={t('pLimit')} inputMode="numeric" dir="ltr" defaultValue={promo?.usage_limit ? String(promo.usage_limit) : ''} />
                    <span className="text-[12.5px] text-ink-3">{promo ? t('pLimitHintUsed', { count: promo.used_count }) : t('pLimitHint')}</span>
                </div>
                <Problem>{error}</Problem>
                <div className="flex items-center justify-between gap-3 pt-1">
                    {promo ? (
                        <Button variant="link" className="text-[#B42318] hover:text-[#912018]" onClick={del} disabled={remove.isPending}>
                            {t('promoDelete')}
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button type="submit" disabled={save.isPending}>
                        {t('save')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// IssuerCard is who issues the receipts. A field left empty stays a blank on the receipt.
function IssuerCard() {
    const t = useTranslations('admin')
    const toast = useToast()
    const { data, isLoading } = useReceiptIssuer()
    const save = useSaveReceiptIssuer()
    const [error, setError] = useState('')

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const get = (k: string) => String(f.get(k) ?? '').trim()
        setError('')
        save.mutate(
            { legal_name: get('legal_name'), address: get('address'), tax_id: get('tax_id'), vat_mention: get('vat_mention') },
            { onSuccess: () => toast(t('issuerSaved')), onError: (err) => setError(apiError(err) ?? t('stateError')) },
        )
    }
    return (
        <section aria-labelledby="issuer-h" className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="issuer-h" className="m-0 text-xl font-extrabold">
                    {t('issuerTitle')}
                </h2>
                {data ? (
                    <span
                        className={cn('rounded-full px-2.5 py-[3px] text-[13px] font-semibold', data.complete ? 'bg-ok-bg text-ok-fg' : 'bg-fill text-ink-3')}
                    >
                        {data.complete ? t('issuerComplete') : t('issuerGaps')}
                    </span>
                ) : null}
            </div>
            <p className="m-0 max-w-[760px] text-[14.5px] leading-[1.55] text-ink-3">{t('issuerIntro')}</p>
            {isLoading ? <div className="sk h-24 rounded-lg" /> : null}
            {data ? (
                <form key={`${data.legal_name}|${data.address}|${data.tax_id}|${data.vat_mention}`} onSubmit={submit} className="flex flex-col gap-3.5">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field name="legal_name" label={t('iLegalName')} maxLength={200} defaultValue={data.legal_name} />
                        <Field name="tax_id" label={t('iTaxId')} maxLength={50} dir="ltr" defaultValue={data.tax_id} />
                        <Field name="address" label={t('iAddress')} maxLength={500} defaultValue={data.address} />
                        <Field name="vat_mention" label={t('iVat')} maxLength={200} defaultValue={data.vat_mention} />
                    </div>
                    <Problem>{error}</Problem>
                    <div>
                        <Button type="submit" variant="secondary" disabled={save.isPending}>
                            {t('save')}
                        </Button>
                    </div>
                </form>
            ) : null}
        </section>
    )
}

// PlansScreen is « Plans et codes promo »: the prices, the limits payments-api checks for each plan, the promo
// codes, and the legal information of the receipts.
export default function PlansScreen() {
    const t = useTranslations('admin')
    const locale = useLocale()
    const format = useFormatter()
    const toast = useToast()
    const plans = useAllPlans()
    const promos = usePromos()
    const stop = useSavePromo()
    // undefined: closed; null: a new code; a code: editing it.
    const [editing, setEditing] = useState<PromoCode | null | undefined>(undefined)

    const all = plans.data ?? []
    const free = all.find((p) => p.name === FREE_PLAN)
    const paid = all.filter((p) => p.name !== FREE_PLAN)
    const keys = quotaKeys(all)
    const quotaCols = { gridTemplateColumns: `minmax(220px,1.6fr) repeat(${Math.max(all.length, 1)}, minmax(120px,1fr))` }
    const promoCols = 'grid grid-cols-[1.2fr_1fr_1fr_1fr_.8fr_110px] items-center gap-3 px-4'
    const now = new Date()

    const stopNow = (p: PromoCode) => {
        if (!window.confirm(t('promoStopConfirm', { code: p.code }))) return
        stop.mutate(
            { id: p.id, input: stopped(p) },
            { onSuccess: () => toast(t('promoStopped', { code: p.code })), onError: (e) => toast(apiError(e) ?? t('stateError')) },
        )
    }
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('plansTitle')}</h1>
                <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('plansSubtitle')}</p>
            </div>
            {plans.isLoading ? <div className="sk h-40 rounded-[22px]" /> : null}
            {plans.isError ? <Problem>{t('plansError')}</Problem> : null}
            {plans.data ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {free ? (
                        <section aria-labelledby="plan-free" className={card}>
                            <div className="flex items-center justify-between gap-3">
                                <h2 id="plan-free" className="m-0 text-xl font-extrabold">
                                    {t('freePlan')}
                                </h2>
                                <span className="rounded-full bg-fill px-2.5 py-[3px] text-[13px] font-semibold text-ink-2">{t('freePrice')}</span>
                            </div>
                            <p className="m-0 text-[14.5px] text-ink-3">{t('freeText')}</p>
                        </section>
                    ) : null}
                    {paid.map((p) => (
                        <PlanCard key={`${p.id}|${p.price}|${p.regular_price ?? ''}`} plan={p} />
                    ))}
                </div>
            ) : null}
            {plans.data && keys.length ? (
                <section aria-labelledby="quotas-h" className={card}>
                    <h2 id="quotas-h" className="m-0 text-xl font-extrabold">
                        {t('quotasTitle')}
                    </h2>
                    <div role="table" aria-labelledby="quotas-h" className="overflow-x-auto">
                        <div role="row" style={quotaCols} className={cn('grid min-w-[560px] items-center gap-3 px-4', head)}>
                            <span role="columnheader">{t('colLimit')}</span>
                            {all.map((p) => (
                                <span role="columnheader" key={p.id}>
                                    {p.name === FREE_PLAN ? t('freePlan') : p.name}
                                </span>
                            ))}
                        </div>
                        {keys.map((k) => (
                            <div role="row" key={k} style={quotaCols} className={cn('grid min-w-[560px] items-center gap-3 px-4', line)}>
                                <span role="rowheader">{isKnown(k) ? t(`quota.${k}`) : <code className="font-mono text-[13px]">{k}</code>}</span>
                                {all.map((p) => (
                                    <span role="cell" key={p.id} className={cn('tabular-nums', p.name !== FREE_PLAN && 'font-bold')}>
                                        {k in (p.quotas ?? {}) ? (p.quotas[k] === 0 ? '—' : format.number(p.quotas[k])) : '—'}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}
            <section aria-labelledby="promos-h" id="codes" className={card}>
                <div className="flex items-center justify-between gap-3">
                    <h2 id="promos-h" className="m-0 text-xl font-extrabold">
                        {t('promosTitle')}
                    </h2>
                    <Button onClick={() => setEditing(null)}>{t('promoNew')}</Button>
                </div>
                <div role="table" aria-labelledby="promos-h" className="overflow-x-auto">
                    <div role="row" className={cn(promoCols, 'min-w-[860px]', head)}>
                        <span role="columnheader">{t('colCode')}</span>
                        <span role="columnheader">{t('colDiscount')}</span>
                        <span role="columnheader">{t('colUses')}</span>
                        <span role="columnheader">{t('colExpires')}</span>
                        <span role="columnheader">{t('colState')}</span>
                        <span role="columnheader" className="sr-only">
                            {t('colAction')}
                        </span>
                    </div>
                    {promos.isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                    {promos.isError ? <p className="m-0 px-4 py-6 text-sm text-[#B42318]">{t('promosError')}</p> : null}
                    {promos.data && promos.data.length === 0 ? <p className="m-0 px-4 py-6 text-sm text-ink-3">{t('noPromos')}</p> : null}
                    {promos.data?.map((p) => {
                        const state = promoState(p, now)
                        return (
                            <div role="row" key={p.id} className={cn(promoCols, 'min-w-[860px]', line)}>
                                <span role="cell" className="min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(p)}
                                        dir="ltr"
                                        className="block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-start font-mono text-[14px] font-bold text-ink hover:text-violet"
                                    >
                                        {p.code}
                                    </button>
                                </span>
                                <span role="cell" className="tabular-nums">
                                    {p.type === 'percentage' ? t('offPercent', { value: p.value }) : t('offFixed', { value: dinars(p.value, locale) })}
                                </span>
                                <span role="cell" className="tabular-nums">
                                    {p.usage_limit ? t('usesOf', { used: p.used_count, limit: p.usage_limit }) : t('usesNoLimit', { used: p.used_count })}
                                </span>
                                <span role="cell">{format.dateTime(new Date(p.valid_until), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span role="cell">
                                    <span className={cn('inline-block rounded-full px-2.5 py-[3px] text-[13px] font-semibold', pill[state])}>
                                        {t(`promoState.${state}`)}
                                    </span>
                                </span>
                                <span role="cell" className="flex justify-end">
                                    {state === 'active' ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={stop.isPending && stop.variables?.id === p.id}
                                            onClick={() => stopNow(p)}
                                        >
                                            {t('promoStop')}
                                        </Button>
                                    ) : (
                                        <Button variant="secondary" size="sm" onClick={() => setEditing(p)}>
                                            {state === 'upcoming' ? t('promoChange') : t('promoRestart')}
                                        </Button>
                                    )}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </section>
            <IssuerCard />
            <PromoModal key={editing === undefined ? 'closed' : (editing?.id ?? 'new')} promo={editing} onClose={() => setEditing(undefined)} />
        </div>
    )
}
