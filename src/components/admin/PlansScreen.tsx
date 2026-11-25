'use client'

import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { dayAt, dinars, months } from '@/components/billing/billing'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, TextArea, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import {
    useAllPlans,
    useCreatePlan,
    useDeletePromo,
    useDeleteSale,
    usePromos,
    useSales,
    useSavePlan,
    useSavePromo,
    useSaveReceiptIssuer,
    useSaveSale,
    useSwitchOffPlan,
} from '@/hooks/useAdminPlans'
import { useReceiptIssuer } from '@/hooks/usePlans'
import { cn } from '@/lib/cn'
import type { Locale, Plan, PromoCode, Sale } from '@/types/plan'
import { apiError } from './SourcesScreen'
import {
    ALLOWED,
    COUNTS,
    DURATIONS,
    FREE_PLAN,
    LABEL_MAX,
    LOCALES,
    SHOWN,
    TAGLINE_MAX,
    countOf,
    dayOf,
    detailsInput,
    detailsTyped,
    launchIsOver,
    newPlanInput,
    planInput,
    promoInput,
    promoState,
    quotaKeys,
    inSale,
    quotasInput,
    renamedInput,
    saleInput,
    sameQuotas,
    shows,
    stopped,
    switchedOn,
    today,
    withCount,
    withShown,
    type PromoState,
} from './plans'

const pill: Record<PromoState, string> = {
    active: 'bg-ok-bg text-ok-fg',
    upcoming: 'bg-violet-soft text-violet-hover',
    expired: 'bg-fill text-ink-3',
    usedUp: 'bg-fill text-ink-3',
}

const salePill: Record<Sale['state'], string> = {
    running: 'bg-ok-bg text-ok-fg',
    upcoming: 'bg-violet-soft text-violet-hover',
    over: 'bg-fill text-ink-3',
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
function PlanCard({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const toast = useToast()
    const save = useSavePlan()
    const off = useSwitchOffPlan()
    const [error, setError] = useState('')
    const [asking, setAsking] = useState(false)
    const m = months(plan.duration_days)
    const period =
        plan.duration_days === 365 ? t('perYear') : m === 1 ? t('perMonth') : m ? t('perMonths', { count: m }) : t('perDays', { count: plan.duration_days })
    const paid = dinars(plan.price, locale)
    const regular = plan.regular_price ? dinars(plan.regular_price, locale) : ''
    const until = dayAt(plan.launch_ends_on)
    // What students pay today, and what happens on the last day of the launch price.
    const hint = !regular
        ? t('priceHintOne', { price: paid })
        : !until
          ? t('priceHintBoth', { price: paid, regular })
          : launchIsOver(plan)
            ? t('priceHintOver', { regular, day: until })
            : t('priceHintUntil', { price: paid, regular, day: until })

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const built = planInput(plan, { price: String(f.get('price')), regular: String(f.get('regular')), until: String(f.get('until') ?? '') })
        if ('error' in built) return setError(t(built.error))
        setError('')
        save.mutate(
            { id: plan.id, input: built.input },
            { onSuccess: () => toast(t('planSaved')), onError: (err) => setError(apiError(err) ?? t('stateError')) },
        )
    }
    // Switching off asks first: students stop seeing the plan, subscribers keep it until their period ends.
    const switchOff = () =>
        off.mutate(plan.id, {
            onSuccess: () => {
                setAsking(false)
                toast(t('planOffDone', { name: plan.name }))
            },
            onError: (err) => {
                setAsking(false)
                toast(apiError(err) ?? t('stateError'))
            },
        })
    const switchOn = () =>
        save.mutate(
            { id: plan.id, input: switchedOn(plan) },
            { onSuccess: () => toast(t('planOnDone', { name: plan.name })), onError: (err) => toast(apiError(err) ?? t('stateError')) },
        )
    return (
        <section
            aria-labelledby={`plan-${plan.id}`}
            className={cn(card, plan.active ? 'border-[1.5px] border-ink shadow-card' : 'border-dashed border-line-strong')}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <h2 id={`plan-${plan.id}`} className="m-0 flex flex-wrap items-center gap-2.5 text-xl font-extrabold">
                        {plan.name}
                        {plan.active ? null : <span className="rounded-full bg-fill px-2.5 py-[3px] text-[13px] font-semibold text-ink-3">{t('planOff')}</span>}
                    </h2>
                    <span className="text-[13px] text-ink-3">{t('planSoldFor', { period: durationLabel(t, plan.duration_days) })}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={onEdit}>
                        {t('planEdit')}
                    </Button>
                    {plan.active ? (
                        <Button variant="link" size="sm" className="text-ink-3" onClick={() => setAsking(true)} disabled={off.isPending}>
                            {t('planOffBtn')}
                        </Button>
                    ) : (
                        <Button variant="link" size="sm" onClick={switchOn} disabled={save.isPending}>
                            {t('planOnBtn')}
                        </Button>
                    )}
                </div>
            </div>
            {plan.active ? null : <p className="m-0 text-[13.5px] leading-[1.5] text-ink-3">{t('planOffHint')}</p>}
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
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
                    <Field name="until" type="date" label={t('launchUntil')} dir="ltr" defaultValue={plan.launch_ends_on ?? ''} />
                </div>
                <Problem>{error}</Problem>
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="secondary" disabled={save.isPending}>
                        {t('save')}
                    </Button>
                    <span className="text-[13px] text-ink-3">{hint}</span>
                </div>
            </form>
            <ConfirmDialog
                open={asking}
                title={t('planOffTitle', { name: plan.name })}
                confirmLabel={t('planOffBtn')}
                busy={off.isPending}
                onConfirm={switchOff}
                onClose={() => setAsking(false)}
            >
                {t('planOffConfirm', { name: plan.name })}
            </ConfirmDialog>
        </section>
    )
}

// durationLabel names a period: 1 month, 3 months, 1 year, or a number of days that is not whole months.
function durationLabel(t: ReturnType<typeof useTranslations<'admin'>>, days: number): string {
    if (days === 365) return t('durYear')
    const m = months(days)
    return m ? t('durMonths', { count: m }) : t('durDays', { count: days })
}

// PlanModal creates a paid plan (name, period, prices) or, for a plan, changes its name and period. A new plan
// takes the limits of the cheapest paid plan, to be set in the table below; it is proposed to students at once
// unless the box is unticked.
function PlanModal({ plan, plans, onClose }: { plan: Plan | null | undefined; plans: Plan[]; onClose: () => void }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const create = useCreatePlan()
    const save = useSavePlan()
    const [error, setError] = useState('')
    // What students read, in each language: all three are kept while switching tabs and saved together.
    const [typed, setTyped] = useState(() => detailsTyped(plan?.details))
    const [tab, setTab] = useState<Locale>('fr')
    if (plan === undefined) return null

    const from = plans.filter((p) => p.name !== FREE_PLAN && p.active).sort((a, b) => a.price - b.price)[0]
    const days = plan?.duration_days ?? 30
    const choices: number[] = (DURATIONS as readonly number[]).includes(days) ? [...DURATIONS] : [...DURATIONS, days]
    const busy = create.isPending || save.isPending
    // 409 is a name already taken, or (payments-api says "length") a new length for a plan students hold.
    const failed = (err: unknown) =>
        setError(
            isAxiosError(err) && err.response?.status === 409
                ? t(/length/.test(apiError(err) ?? '') ? 'durationHeld' : 'nameTaken')
                : (apiError(err) ?? t('stateError')),
        )

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const get = (k: string) => String(f.get(k) ?? '')
        const described = detailsInput(typed)
        if ('error' in described) {
            setTab(described.locale)
            return setError(t(described.error))
        }
        if (plan) {
            const built = renamedInput(plan, { name: get('name'), duration: get('duration') }, plans)
            if ('error' in built) return setError(t(built.error))
            setError('')
            return save.mutate(
                { id: plan.id, input: { ...built.input, details: described.details } },
                {
                    onSuccess: () => {
                        toast(t('planUpdated'))
                        onClose()
                    },
                    onError: failed,
                },
            )
        }
        const built = newPlanInput(
            {
                name: get('name'),
                duration: get('duration'),
                price: get('price'),
                regular: get('regular'),
                until: get('until'),
                active: f.get('active') === 'on',
            },
            plans,
            from,
        )
        if ('error' in built) return setError(t(built.error))
        setError('')
        create.mutate(Object.keys(described.details).length ? { ...built.input, details: described.details } : built.input, {
            onSuccess: () => {
                toast(t('planCreated', { name: built.input.name }))
                onClose()
            },
            onError: failed,
        })
    }
    return (
        <Modal open onClose={onClose} title={plan ? t('planEditTitle') : t('planAddTitle')} width={560}>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
                    <div className="flex flex-col gap-1.5">
                        <Field name="name" label={t('planName')} required maxLength={100} defaultValue={plan?.name} />
                        <span className="text-[12.5px] text-ink-3">{t('planNameHint')}</span>
                    </div>
                    <label className="flex flex-col gap-1.5 self-start text-[13.5px] font-medium text-ink-2">
                        {t('planDuration')}
                        <select name="duration" defaultValue={String(days)} className={inputClass}>
                            {choices.map((d) => (
                                <option key={d} value={d}>
                                    {durationLabel(t, d)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {plan ? (
                    <p className="m-0 text-[13px] leading-[1.5] text-ink-3">{t('planEditHint')}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Field name="regular" label={t('newRegular')} inputMode="decimal" dir="ltr" placeholder={t('regularNone')} />
                            <Field name="price" label={t('newPrice')} inputMode="decimal" dir="ltr" required />
                            <Field name="until" type="date" label={t('launchUntil')} dir="ltr" />
                        </div>
                        <p className="m-0 text-[13px] leading-[1.5] text-ink-3">{from ? t('planLimitsFrom', { name: from.name }) : t('planLimitsEmpty')}</p>
                        <label className="flex items-center gap-2.5 text-[14.5px]">
                            <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-ink" />
                            {t('planActiveNow')}
                        </label>
                    </>
                )}
                <fieldset className="m-0 flex flex-col gap-3 rounded-2xl border border-line-soft p-4">
                    <legend className="px-1.5 text-[14px] font-semibold">{t('detailsTitle')}</legend>
                    <Segmented<Locale>
                        label={t('detailsLang')}
                        value={tab}
                        onChange={setTab}
                        options={[
                            { value: 'fr', label: 'Français' },
                            { value: 'en', label: 'English' },
                            { value: 'ar', label: 'العربية' },
                        ]}
                    />
                    {LOCALES.filter((l) => l === tab).map((l) => {
                        const set = (k: 'label' | 'tagline' | 'features', v: string) => setTyped((d) => ({ ...d, [l]: { ...d[l], [k]: v } }))
                        const dir = l === 'ar' ? 'rtl' : 'ltr'
                        return (
                            <div key={l} className="flex flex-col gap-3">
                                <Field
                                    name={`detail-label-${l}`}
                                    label={t('detailLabel')}
                                    dir={dir}
                                    value={typed[l].label}
                                    onChange={(e) => set('label', e.target.value)}
                                    maxLength={LABEL_MAX}
                                />
                                <Field
                                    name={`detail-tagline-${l}`}
                                    label={t('detailTagline')}
                                    dir={dir}
                                    value={typed[l].tagline}
                                    onChange={(e) => set('tagline', e.target.value)}
                                    maxLength={TAGLINE_MAX}
                                />
                                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                                    {t('detailFeatures')}
                                    <TextArea
                                        name={`detail-features-${l}`}
                                        dir={dir}
                                        rows={5}
                                        value={typed[l].features}
                                        onChange={(e) => set('features', e.target.value)}
                                    />
                                    <span className="text-[12.5px] font-normal text-ink-3">{t('detailFeaturesHint')}</span>
                                </label>
                            </div>
                        )
                    })}
                </fieldset>
                <Problem>{error}</Problem>
                <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={busy}>
                        {plan ? t('save') : t('planCreate')}
                    </Button>
                </div>
            </form>
        </Modal>
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

// SaleModal writes a sale: a percentage off, without a code, from a first to a last day. No plan ticked: every
// paid plan. The price each plan will cost is shown as the percentage is typed.
function SaleModal({ sale, plans, onClose }: { sale: Sale | null | undefined; plans: Plan[]; onClose: () => void }) {
    const t = useTranslations('admin')
    const locale = useLocale()
    const toast = useToast()
    const save = useSaveSale()
    const remove = useDeleteSale()
    const [error, setError] = useState('')
    const [percent, setPercent] = useState(sale ? String(sale.percent) : '')
    const [only, setOnly] = useState<string[]>(sale?.plan_ids ?? [])
    if (sale === undefined) return null

    const off = Number(percent)
    const preview = Number.isInteger(off) && off >= 1 && off <= 90
    const covered = plans.filter((p) => only.length === 0 || only.includes(p.id))

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const get = (k: string) => String(f.get(k) ?? '')
        const built = saleInput({ name: get('name'), percent, from: get('from'), until: get('until') }, only)
        if ('error' in built) return setError(t(built.error))
        setError('')
        save.mutate(
            { id: sale?.id, input: built.input },
            {
                onSuccess: () => {
                    toast(t('saleSaved'))
                    onClose()
                },
                onError: (err) => setError(apiError(err) ?? t('stateError')),
            },
        )
    }
    const del = () => {
        if (!sale || !window.confirm(t(sale.state === 'running' ? 'saleStopConfirm' : 'saleDeleteConfirm', { name: sale.name }))) return
        remove.mutate(sale.id, {
            onSuccess: () => {
                toast(t('saleDeleted'))
                onClose()
            },
            onError: (err) => setError(apiError(err) ?? t('stateError')),
        })
    }
    return (
        <Modal open onClose={onClose} title={sale ? t('saleEdit') : t('saleAdd')} width={560}>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                    <Field name="name" label={t('sName')} required maxLength={60} defaultValue={sale?.name} />
                    <span className="text-[12.5px] text-ink-3">{t('sNameHint')}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Field
                        name="percent"
                        label={t('sPercent')}
                        required
                        inputMode="numeric"
                        dir="ltr"
                        value={percent}
                        onChange={(e) => setPercent(e.target.value)}
                    />
                    <Field name="from" type="date" label={t('sFrom')} required dir="ltr" defaultValue={sale?.starts_on ?? today()} />
                    <Field name="until" type="date" label={t('sUntil')} required dir="ltr" defaultValue={sale?.ends_on ?? ''} />
                </div>
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className="mb-1.5 p-0 text-[13.5px] font-medium text-ink-2">{t('sPlans')}</legend>
                    {plans.map((p) => (
                        <label key={p.id} className="flex items-center gap-2.5 text-[14.5px]">
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-ink"
                                checked={only.includes(p.id)}
                                onChange={(e) => setOnly((ids) => (e.target.checked ? [...ids, p.id] : ids.filter((id) => id !== p.id)))}
                            />
                            {p.name}
                        </label>
                    ))}
                    <span className="text-[12.5px] text-ink-3">{t('sPlansHint')}</span>
                </fieldset>
                {preview && covered.length ? (
                    <ul className="m-0 flex list-none flex-col gap-1 rounded-xl bg-fill-3 px-4 py-3 text-[14px]">
                        {covered.map((p) => {
                            const cost = inSale(p, off)
                            return (
                                <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2">
                                    <span>{p.name}</span>
                                    {cost.kept ? (
                                        <span className="text-ink-3">{t('saleKept', { price: dinars(cost.price, locale) })}</span>
                                    ) : (
                                        <span dir="ltr" className="tabular-nums">
                                            <s className="text-ink-3">{dinars(cost.usual, locale)} DT</s> <strong>{dinars(cost.price, locale)} DT</strong>
                                        </span>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                ) : null}
                <Problem>{error}</Problem>
                <div className="flex items-center justify-between gap-3 pt-1">
                    {sale ? (
                        <Button variant="link" className="text-[#B42318] hover:text-[#912018]" onClick={del} disabled={remove.isPending}>
                            {t(sale.state === 'running' ? 'saleStopNow' : 'saleDelete')}
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

// Sales lists the reductions without a code: what is running or to come first, then what is over.
function Sales({ plans }: { plans: Plan[] }) {
    const t = useTranslations('admin')
    const format = useFormatter()
    const sales = useSales()
    // undefined: closed; null: a new sale; a sale: editing it.
    const [editing, setEditing] = useState<Sale | null | undefined>(undefined)
    const cols = 'grid grid-cols-[1.4fr_.7fr_1fr_1fr_1.2fr_.8fr_110px] items-center gap-3 px-4'
    const day = (d: string) => format.dateTime(dayAt(d) ?? new Date(d), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    const names = (s: Sale) =>
        s.plan_ids.length === 0
            ? t('saleAllPlans')
            : s.plan_ids
                  .map((id) => plans.find((p) => p.id === id)?.name)
                  .filter(Boolean)
                  .join(', ') || t('saleAllPlans')
    return (
        <section aria-labelledby="sales-h" id="sales" className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <h2 id="sales-h" className="m-0 text-xl font-extrabold">
                        {t('salesTitle')}
                    </h2>
                    <p className="m-0 max-w-[820px] text-[14.5px] leading-[1.55] text-ink-3">{t('salesHint')}</p>
                </div>
                <Button onClick={() => setEditing(null)}>{t('saleNew')}</Button>
            </div>
            <div role="table" aria-labelledby="sales-h" className="overflow-x-auto">
                <div role="row" className={cn(cols, 'min-w-[900px]', head)}>
                    <span role="columnheader">{t('colSale')}</span>
                    <span role="columnheader">{t('colDiscount')}</span>
                    <span role="columnheader">{t('colFrom')}</span>
                    <span role="columnheader">{t('colLastDay')}</span>
                    <span role="columnheader">{t('colPlans')}</span>
                    <span role="columnheader">{t('colState')}</span>
                    <span role="columnheader" className="sr-only">
                        {t('colAction')}
                    </span>
                </div>
                {sales.isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                {sales.isError ? <p className="m-0 px-4 py-6 text-sm text-[#B42318]">{t('salesError')}</p> : null}
                {sales.data && sales.data.length === 0 ? <p className="m-0 px-4 py-6 text-sm text-ink-3">{t('noSales')}</p> : null}
                {sales.data?.map((s) => (
                    <div role="row" key={s.id} className={cn(cols, 'min-w-[900px]', line)}>
                        <span role="cell" className="min-w-0 truncate font-semibold">
                            {s.name}
                        </span>
                        <span role="cell" className="tabular-nums">
                            {t('offPercent', { value: s.percent })}
                        </span>
                        <span role="cell">{day(s.starts_on)}</span>
                        <span role="cell">{day(s.ends_on)}</span>
                        <span role="cell" className="min-w-0 truncate">
                            {names(s)}
                        </span>
                        <span role="cell">
                            <span className={cn('inline-block rounded-full px-2.5 py-[3px] text-[13px] font-semibold', salePill[s.state])}>
                                {t(`saleState.${s.state}`)}
                            </span>
                        </span>
                        <span role="cell" className="flex justify-end">
                            <Button variant="secondary" size="sm" onClick={() => setEditing(s)}>
                                {s.state === 'over' ? t('promoRestart') : t('promoChange')}
                            </Button>
                        </span>
                    </div>
                ))}
            </div>
            <SaleModal key={editing === undefined ? 'closed' : (editing?.id ?? 'new')} sale={editing} plans={plans} onClose={() => setEditing(undefined)} />
        </section>
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
// Limits is « Ce que chaque plan permet »: the number limits and the groups of the CV diagnosis each plan shows,
// for a student with no subscription first. An empty number sets no limit; 0 allows none.
function Limits({ plans }: { plans: Plan[] }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const save = useSavePlan()
    const [draft, setDraft] = useState<Record<string, Record<string, number>>>(() => Object.fromEntries(plans.map((p) => [p.id, { ...(p.quotas ?? {}) }])))
    const [typed, setTyped] = useState<Record<string, string>>({})
    const [error, setError] = useState('')
    const others = quotaKeys(plans).filter(
        (k) => !(COUNTS as readonly string[]).includes(k) && !(SHOWN as readonly string[]).includes(k) && !(ALLOWED as readonly string[]).includes(k),
    )
    const changed = plans.filter((p) => !sameQuotas(p.quotas ?? {}, draft[p.id]))
    const bad = Object.keys(typed).some((cell) => {
        const [id, key] = cell.split('|')
        return withCount(draft[id] ?? {}, key, typed[cell]) === null
    })
    const cols = { gridTemplateColumns: `minmax(220px,1.6fr) repeat(${Math.max(plans.length, 1)}, minmax(130px,1fr))` }
    const row = 'grid min-w-[560px] items-center gap-3 px-4'
    const nameOf = (p: Plan) => (p.name === FREE_PLAN ? t('freePlan') : p.name)
    const setCount = (p: Plan, key: string, value: string) => {
        setTyped({ ...typed, [`${p.id}|${key}`]: value })
        const next = withCount(draft[p.id] ?? {}, key, value)
        if (next) setDraft({ ...draft, [p.id]: next })
    }
    const submit = async () => {
        setError('')
        try {
            for (const p of changed) await save.mutateAsync({ id: p.id, input: quotasInput(p, draft[p.id]) })
            toast(t('limitsSaved'))
        } catch (err) {
            setError(apiError(err) ?? t('stateError'))
        }
    }
    return (
        <section aria-labelledby="quotas-h" className={card}>
            <div className="flex flex-col gap-1">
                <h2 id="quotas-h" className="m-0 text-xl font-extrabold">
                    {t('quotasTitle')}
                </h2>
                <p className="m-0 max-w-[820px] text-[14.5px] leading-[1.55] text-ink-3">{t('limitsHint')}</p>
            </div>
            <div role="table" aria-labelledby="quotas-h" className="overflow-x-auto">
                <div role="row" style={cols} className={cn(row, head)}>
                    <span role="columnheader">{t('colLimit')}</span>
                    {plans.map((p) => (
                        <span role="columnheader" key={p.id}>
                            {nameOf(p)}
                        </span>
                    ))}
                </div>
                {COUNTS.map((k) => (
                    <div role="row" key={k} style={cols} className={cn(row, line)}>
                        <span role="rowheader">{t(`quota.${k}`)}</span>
                        {plans.map((p) => (
                            <span role="cell" key={p.id}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label={`${t(`quota.${k}`)} · ${nameOf(p)}`}
                                    placeholder={t('noLimit')}
                                    value={typed[`${p.id}|${k}`] ?? countOf(draft[p.id], k)}
                                    onChange={(e) => setCount(p, k, e.target.value)}
                                    className={cn(inputClass, 'h-9 max-w-[130px] tabular-nums')}
                                />
                            </span>
                        ))}
                    </div>
                ))}
                {ALLOWED.map((k) => (
                    <div role="row" key={k} style={cols} className={cn(row, line)}>
                        <span role="rowheader">{t(`quota.${k}`)}</span>
                        {plans.map((p) => (
                            <span role="cell" key={p.id}>
                                <input
                                    type="checkbox"
                                    aria-label={`${t(`quota.${k}`)} · ${nameOf(p)}`}
                                    checked={shows(draft[p.id], k)}
                                    onChange={(e) => setDraft({ ...draft, [p.id]: withShown(draft[p.id] ?? {}, k, e.target.checked) })}
                                    className="h-4 w-4 accent-ink"
                                />
                            </span>
                        ))}
                    </div>
                ))}
                <div role="row" style={cols} className={cn(row, 'pb-1 pt-4 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-ink-3')}>
                    <span role="rowheader">{t('limitsDiagnosis')}</span>
                </div>
                {SHOWN.map((k) => (
                    <div role="row" key={k} style={cols} className={cn(row, line)}>
                        <span role="rowheader">{t(`quota.${k}`)}</span>
                        {plans.map((p) => (
                            <span role="cell" key={p.id}>
                                <input
                                    type="checkbox"
                                    aria-label={`${t(`quota.${k}`)} · ${nameOf(p)}`}
                                    checked={shows(draft[p.id], k)}
                                    onChange={(e) => setDraft({ ...draft, [p.id]: withShown(draft[p.id] ?? {}, k, e.target.checked) })}
                                    className="h-4 w-4 accent-ink"
                                />
                            </span>
                        ))}
                    </div>
                ))}
                {others.map((k) => (
                    <div role="row" key={k} style={cols} className={cn(row, line)}>
                        <span role="rowheader">
                            <code className="font-mono text-[13px]">{k}</code>
                        </span>
                        {plans.map((p) => (
                            <span role="cell" key={p.id} className="tabular-nums">
                                {countOf(p.quotas, k) || '—'}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
            {error || bad ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {error || t('limitsInvalid')}
                </p>
            ) : null}
            <Button className="self-start" disabled={save.isPending || bad || changed.length === 0} onClick={submit}>
                {t('limitsSave')}
            </Button>
        </section>
    )
}

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
    // The same for plans: undefined closed, null a new plan, a plan its name and period.
    const [planEditing, setPlanEditing] = useState<Plan | null | undefined>(undefined)

    const all = plans.data ?? []
    const free = all.find((p) => p.name === FREE_PLAN)
    const paid = all.filter((p) => p.name !== FREE_PLAN)
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
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('plansTitle')}</h1>
                    <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('plansSubtitle')}</p>
                </div>
                {plans.data ? <Button onClick={() => setPlanEditing(null)}>{t('planNew')}</Button> : null}
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
                        <PlanCard key={`${p.id}|${p.price}|${p.regular_price ?? ''}|${p.launch_ends_on ?? ''}`} plan={p} onEdit={() => setPlanEditing(p)} />
                    ))}
                </div>
            ) : null}
            {plans.data && all.length ? <Limits key={all.map((p) => `${p.id}:${JSON.stringify(p.quotas ?? {})}`).join('|')} plans={all} /> : null}
            {plans.data ? <Sales plans={paid} /> : null}
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
            <PlanModal
                key={planEditing === undefined ? 'plan-closed' : `plan-${planEditing?.id ?? 'new'}`}
                plan={planEditing}
                plans={all}
                onClose={() => setPlanEditing(undefined)}
            />
        </div>
    )
}
