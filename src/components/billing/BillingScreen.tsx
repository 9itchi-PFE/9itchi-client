'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { Sk } from '@/components/jobs/OfferStates'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCheckout, useMySubscription, useMyStudentDiscount, usePayments, usePlans, useSetRenewal, useValidatePromo, useVerifyPayment } from '@/hooks/usePlans'
import { cn } from '@/lib/cn'
import { atKeptPrice, type MySubscription, type Payment, type Plan, type PromoCheck } from '@/types/plan'
import {
    KEEP_DAYS,
    RENEW_DAYS,
    dayAt,
    daysLeft,
    dinars,
    fromReturn,
    lengthOf,
    millimes,
    paidPlans,
    perMonth,
    planText,
    promoReason,
    studentOff,
    regularOf,
    tnd,
    type Return,
} from './billing'

const eyebrow = 'font-mono text-[11px] font-semibold uppercase tracking-[.08em]'
const panel = 'flex flex-col gap-4 rounded-[20px] border border-line-soft bg-white p-6'

// useLength says how long a plan lasts: in years, in months, else in days.
function useLength() {
    const t = useTranslations('billing')
    return (days: number) => {
        const l = lengthOf(days)
        return t(l.unit, { count: l.count })
    }
}

// PlanChoice lets the student pick a plan when there are several (a month, a year): its price, its period and,
// for a longer one, what it comes to per month.
function PlanChoice({ plans, chosen, onChoose }: { plans: Plan[]; chosen: Plan; onChoose: (p: Plan) => void }) {
    const t = useTranslations('billing')
    const locale = useLocale()
    const length = useLength()
    return (
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2 p-0 text-[15px] font-semibold">{t('choosePlan')}</legend>
            {plans.map((p) => {
                const on = p.id === chosen.id
                const each = perMonth(p)
                const regular = regularOf(p)
                const text = planText(p, locale)
                return (
                    <label
                        key={p.id}
                        className={cn(
                            'flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white px-5 py-4',
                            on ? 'border-[1.5px] border-ink' : 'border border-line-strong',
                        )}
                    >
                        <span className="flex items-center gap-3">
                            <input type="radio" name="plan" checked={on} onChange={() => onChoose(p)} className="h-4 w-4 accent-ink" />
                            <span className="flex flex-col gap-0.5">
                                <strong className="text-[16px] font-semibold">{text.label}</strong>
                                {text.tagline ? <span className="text-sm text-ink-3">{text.tagline}</span> : null}
                                {each ? <span className="text-sm text-ink-3">{t('perMonthEq', { amount: dinars(each, locale) })}</span> : null}
                            </span>
                        </span>
                        <span className="flex items-baseline gap-2" dir="ltr">
                            {regular ? <s className="text-sm text-ink-3">{dinars(regular / 1000, locale)} DT</s> : null}
                            <strong className="font-display text-[26px] font-extrabold leading-none">{dinars(p.price, locale)} DT</strong>
                            <span className="text-sm text-ink-3">/ {length(p.duration_days)}</span>
                        </span>
                    </label>
                )
            })}
        </fieldset>
    )
}

// Pay is the subscribe form: what the plan adds, a promo code, the amount, and the way to Flouci.
function Pay({ plan, extending, choice }: { plan: Plan; extending: MySubscription | null; choice?: ReactNode }) {
    const t = useTranslations('billing')
    const tc = useTranslations('common')
    const locale = useLocale()
    const format = useFormatter()
    const length = useLength()
    const toast = useToast()
    const router = useRouter()
    const validate = useValidatePromo()
    const checkout = useCheckout()
    const student = useMyStudentDiscount().data
    const [code, setCode] = useState('')
    const [promo, setPromo] = useState<{ code: string; check: PromoCheck } | null>(null)
    const [promoError, setPromoError] = useState('')
    const [leaving, setLeaving] = useState(false)

    const price = millimes(plan.price)
    const regular = regularOf(plan)
    const launchEnd = dayAt(plan.launch_ends_on)
    const sale = plan.sale
    const saleEnd = dayAt(sale?.ends_on)
    const afterPromo = promo ? millimes(promo.check.final_price) : price
    // The student discount comes last, on what is left after the sale and the promo code (as payments-api counts it).
    const studentPercent = student?.eligible ? student.percent : 0
    const due = afterPromo - studentOff(afterPromo, studentPercent)
    const amount = `${tnd(due, locale)} TND`

    const applyCode = (e: FormEvent) => {
        e.preventDefault()
        const c = code.trim().toUpperCase()
        if (!c) return
        setPromoError('')
        validate.mutate(
            { code: c, plan_id: plan.id },
            {
                onSuccess: (check) => {
                    if (!check.valid) return setPromoError(t(promoReason(check.reason)))
                    setPromo({ code: c, check })
                    setCode('')
                },
                onError: () => setPromoError(tc('error')),
            },
        )
    }

    const pay = () =>
        checkout.mutate(
            { plan_id: plan.id, promo_code: promo?.code },
            {
                onSuccess: (c) => {
                    // Nothing due (a 100 % code): payments-api activated the plan, there is no page to pay on.
                    if (!c.payment_url) return router.replace(`/settings/billing?payment=success&id=${c.payment_id}`)
                    setLeaving(true)
                    window.location.assign(c.payment_url)
                },
                onError: (e) => {
                    const status = isAxiosError(e) ? e.response?.status : undefined
                    const message = isAxiosError(e) ? ((e.response?.data as { error?: string } | undefined)?.error ?? '') : ''
                    if (status === 400 && /promo/i.test(message)) {
                        setPromo(null)
                        setPromoError(t(promoReason(message)))
                    } else toast(status === 503 || status === 502 ? t('gatewayDown') : tc('error'))
                },
            },
        )

    const busy = checkout.isPending || leaving
    const text = planText(plan, locale)
    const features = [1, 2, 3, 4] as const
    return (
        <div className="flex flex-wrap items-start gap-7">
            {extending ? null : (
                <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-4">
                    {choice ?? (
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border-[1.5px] border-ink bg-white px-6 py-5">
                            <div className="flex flex-col gap-1">
                                <strong className="text-[17px] font-semibold">{text.label}</strong>
                                {text.tagline ? <span className="text-sm text-ink-3">{text.tagline}</span> : null}
                                {regular ? (
                                    <span className="inline-flex h-6 flex-none items-center self-start rounded-full bg-lime px-[9px] text-xs font-bold">
                                        {sale && saleEnd
                                            ? t('saleUntil', { name: sale.name, percent: sale.percent, day: saleEnd })
                                            : launchEnd
                                              ? t('launchPriceUntil', { day: launchEnd })
                                              : t('launchPrice')}
                                    </span>
                                ) : null}
                                <span className="text-sm text-ink-3">{t('oneOff', { length: length(plan.duration_days) })}</span>
                            </div>
                            <span className="flex items-baseline gap-2">
                                {regular ? (
                                    <s dir="ltr" className="text-base text-ink-3">
                                        <span className="sr-only">{t('regularPrice')} </span>
                                        {dinars(plan.regular_price ?? 0, locale)} DT
                                    </s>
                                ) : null}
                                <strong dir="ltr" className="font-display text-[34px] font-extrabold leading-none">
                                    {dinars(plan.price, locale)} DT
                                </strong>
                                <span className="text-sm text-ink-3">/ {length(plan.duration_days)}</span>
                            </span>
                        </div>
                    )}
                    {text.features.length ? (
                        <ul data-testid="plan-features" className="m-0 flex list-none flex-col gap-3 rounded-[20px] border border-line-soft bg-white p-6">
                            {text.features.map((f) => (
                                <li key={f} className="flex items-start gap-3 text-[15px]">
                                    <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-lime text-ink">
                                        <Icon name="check" size={12} strokeWidth={3} />
                                    </span>
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    <div className="flex flex-col gap-4 rounded-[20px] bg-ink p-6 text-white">
                        <span className={cn(eyebrow, 'text-[#B8BCC6]')}>{t('addsTitle')}</span>
                        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                            {features.map((n) => (
                                <li key={n} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-lime text-ink">
                                        <Icon name="check" size={12} strokeWidth={3} />
                                    </span>
                                    <span className="flex flex-col gap-0.5">
                                        <strong className="text-[15.5px] font-semibold">{t(`adds${n}`)}</strong>
                                        <span className="text-sm text-[#C8CBD3]">{t(`adds${n}Text`)}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="m-0 text-sm leading-[1.6] text-ink-3">{t('withoutIt')}</p>
                </div>
            )}

            <section
                aria-labelledby="pay-h"
                className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px] rounded-3xl border-[1.5px] border-ink bg-white p-7 shadow-pop"
            >
                <h2 id="pay-h" className="m-0 text-2xl font-extrabold">
                    {t('summary')}
                </h2>
                <div className="flex items-start gap-3.5 rounded-2xl border border-line-soft p-4">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-violet-soft text-violet-hover">
                        <Icon name="lock" size={19} />
                    </span>
                    <span className="flex flex-col gap-1">
                        <strong className="text-[15.5px] font-semibold">{t('flouciTitle')}</strong>
                        <span className="text-sm leading-[1.55] text-ink-2">{t('flouciText')}</span>
                    </span>
                </div>

                {promo ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-ok-bg px-4 py-3 text-sm font-semibold text-ok-fg">
                        <span>{t('promoApplied', { code: promo.code, amount: tnd(millimes(promo.check.discount_amount), locale) })}</span>
                        <button
                            type="button"
                            className="hit cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-ok-fg underline"
                            onClick={() => setPromo(null)}
                        >
                            {t('promoRemove')}
                        </button>
                    </div>
                ) : sale ? (
                    <p className="m-0 text-[13.5px] leading-[1.5] text-ink-3">{t('promoDuringSale')}</p>
                ) : (
                    <form onSubmit={applyCode} className="flex flex-col gap-1.5">
                        <label htmlFor="promo" className="text-sm font-medium text-ink-2">
                            {t('promoLabel')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="promo"
                                dir="ltr"
                                maxLength={64}
                                value={code}
                                aria-invalid={!!promoError}
                                aria-describedby={promoError ? 'promo-err' : undefined}
                                onChange={(e) => {
                                    setCode(e.target.value)
                                    setPromoError('')
                                }}
                                placeholder={t('promoPlaceholder')}
                                className="box-border h-12 min-w-0 flex-1 rounded-xl border-[1.5px] border-line-strong px-3.5 text-[15px] uppercase text-ink placeholder:normal-case placeholder:text-ink-4"
                            />
                            <Button type="submit" variant="secondary" className="h-12 rounded-xl px-4" disabled={validate.isPending || !code.trim()}>
                                {t('promoApply')}
                            </Button>
                        </div>
                        {promoError ? (
                            <span id="promo-err" role="alert" className="text-[13.5px] text-[#B42318]">
                                {promoError}
                            </span>
                        ) : null}
                    </form>
                )}

                {student?.needs_verified_email ? (
                    <p className="m-0 rounded-xl bg-violet-soft px-4 py-3 text-[13.5px] leading-[1.5] text-violet-hover">
                        {t('studentVerify', { percent: student.percent, domain: student.domain ?? '' })}
                    </p>
                ) : null}

                <dl className="m-0 flex flex-col gap-2.5 rounded-2xl bg-fill-3 p-4 text-[15px]">
                    <div className="flex justify-between gap-3">
                        <dt>
                            {text.label} · {length(plan.duration_days)}
                        </dt>
                        <dd className="m-0 tabular-nums">
                            {regular ? (
                                <s className="me-1.5 text-ink-3">
                                    <span className="sr-only">{t('regularPrice')} </span>
                                    {tnd(regular, locale)}
                                </s>
                            ) : null}
                            {tnd(price, locale)} TND
                        </dd>
                    </div>
                    {promo ? (
                        <div className="flex justify-between gap-3 text-ok-fg">
                            <dt>{t('promoLine', { code: promo.code })}</dt>
                            <dd className="m-0 tabular-nums">−{tnd(price - afterPromo, locale)} TND</dd>
                        </div>
                    ) : null}
                    {studentPercent > 0 ? (
                        <div className="flex justify-between gap-3 text-ok-fg">
                            <dt>{t('studentLine', { percent: studentPercent })}</dt>
                            <dd className="m-0 tabular-nums">−{tnd(afterPromo - due, locale)} TND</dd>
                        </div>
                    ) : null}
                    <div className="flex justify-between gap-3 border-t border-line pt-2.5 font-semibold">
                        <dt>{t('dueToday')}</dt>
                        <dd className="m-0 tabular-nums">{amount}</dd>
                    </div>
                    <dd className="m-0 text-[13px] leading-[1.5] text-ink-3">
                        {extending?.subscription
                            ? t('extendNote', {
                                  date: format.dateTime(new Date(extending.subscription.ends_at), { day: 'numeric', month: 'long', year: 'numeric' }),
                              })
                            : t('noRenewal')}
                    </dd>
                </dl>

                <Button size="lg" className="h-[58px] w-full gap-2.5 rounded-2xl text-base" disabled={busy} onClick={pay}>
                    {leaving ? t('toFlouci') : due === 0 ? t('activateFree') : t('pay', { amount })}
                    {due > 0 && !leaving ? <Icon name="arrow" size={16} stroke="#D6F25E" className="-rotate-45 rtl:rotate-[225deg]" /> : null}
                </Button>
                <p className="m-0 text-center text-[13px] leading-[1.5] text-ink-3">{t('payNote')}</p>
                <p className="m-0 text-center text-[13px] leading-[1.5] text-ink-3">{t('refundRule')}</p>
            </section>
        </div>
    )
}

// Back is what the page shows when the browser returns from Flouci: payments-api is asked what really happened.
function Back({ back, plan, onRetry }: { back: Return; plan: Plan | undefined; onRetry: () => void }) {
    const t = useTranslations('billing')
    const locale = useLocale()
    const format = useFormatter()
    const { mutate: verify } = useVerifyPayment()
    const [payment, setPayment] = useState<Payment | null>(null)
    const [gaveUp, setGaveUp] = useState(false)
    const tries = useRef(0)

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>
        let stopped = false
        const ask = () =>
            verify(back.id, {
                onSuccess: (p) => {
                    if (stopped) return
                    setPayment(p)
                    // Flouci can take a few seconds to confirm: ask a few more times before giving up.
                    if (p.status === 'pending' && back.outcome === 'success' && ++tries.current < 8) timer = setTimeout(ask, 2500)
                    else if (p.status === 'pending') setGaveUp(true)
                },
                onError: () => !stopped && setGaveUp(true),
            })
        tries.current = 0
        ask()
        return () => {
            stopped = true
            clearTimeout(timer)
        }
    }, [back.id, back.outcome, verify])

    const box =
        'mx-auto box-border flex w-full max-w-[620px] flex-col items-center gap-3.5 rounded-3xl border-[1.5px] border-ink bg-white px-10 py-11 text-center shadow-pop'
    if (payment?.status === 'completed') {
        return (
            <section aria-live="polite" className={box}>
                <span className={cn(eyebrow, 'text-ink-3')}>{t('backOk')}</span>
                <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-lime">
                    <Icon name="check" size={30} strokeWidth={2.4} />
                </span>
                <h1 className="m-0 text-[34px] font-extrabold leading-[1.1]">{t('okTitle')}</h1>
                <p className="m-0 max-w-[460px] text-base leading-[1.6] text-ink-3">
                    {payment.period_end
                        ? t('okText', { date: format.dateTime(new Date(payment.period_end), { day: 'numeric', month: 'long', year: 'numeric' }) })
                        : t('okTextShort')}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2.5">
                    <ButtonLink href="/jobs" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('okContinue')}
                    </ButtonLink>
                    <ButtonLink href={`/settings/billing/receipts/${payment.id}`} variant="secondary" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('seeReceipt')}
                    </ButtonLink>
                </div>
            </section>
        )
    }
    const failed = payment?.status === 'failed' || (back.outcome === 'failed' && payment !== null) || gaveUp
    if (failed) {
        const unsure = gaveUp && back.outcome === 'success'
        return (
            <section aria-live="polite" className={box}>
                <span className={cn(eyebrow, 'text-ink-3')}>{t('backKo')}</span>
                <h1 className="m-0 text-[34px] font-extrabold leading-[1.1]">{unsure ? t('unsureTitle') : t('koTitle')}</h1>
                <p className="m-0 max-w-[460px] text-base leading-[1.6] text-ink-3">{unsure ? t('unsureText') : t('koText')}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2.5">
                    {unsure ? (
                        <Button size="lg" className="h-12 rounded-xl px-5 text-[15px]" onClick={() => window.location.reload()}>
                            {t('checkAgain')}
                        </Button>
                    ) : (
                        <Button size="lg" className="h-12 rounded-xl px-5 text-[15px]" onClick={onRetry}>
                            {plan ? t('retry', { amount: `${dinars(plan.price, locale)} DT` }) : t('retryShort')}
                        </Button>
                    )}
                    <ButtonLink href="/jobs" variant="secondary" size="lg" className="h-12 rounded-xl px-5 text-[15px]">
                        {t('backToOffers')}
                    </ButtonLink>
                </div>
                <p className="m-0 text-[13px] text-ink-3">{t('koRef', { ref: payment?.provider_ref || back.id.slice(0, 8) })}</p>
            </section>
        )
    }
    return (
        <section aria-busy="true" className={box}>
            <span className={cn(eyebrow, 'text-ink-3')}>{t('backChecking')}</span>
            <h1 className="m-0 text-[30px] font-extrabold leading-[1.1]">{t('checkingTitle')}</h1>
            <p role="status" className="m-0 max-w-[460px] text-base leading-[1.6] text-ink-3">
                {t('checkingText')}
            </p>
            <Sk className="h-3 w-48 rounded" />
        </section>
    )
}

function Receipts({ payments }: { payments: Payment[] }) {
    const t = useTranslations('billing')
    const locale = useLocale()
    const format = useFormatter()
    const row =
        'grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-b border-line-soft py-3 text-[14.5px] last:border-b-0 sm:grid-cols-[1fr_1fr_1fr_auto]'
    return (
        <section aria-labelledby="receipts-h" className={panel}>
            <h2 id="receipts-h" className="m-0 text-[19px] font-extrabold">
                {t('receipts')}
            </h2>
            {payments.length === 0 ? (
                <p className="m-0 text-sm text-ink-3">{t('noReceipts')}</p>
            ) : (
                <div role="table" aria-labelledby="receipts-h">
                    <div role="row" className={cn(row, 'hidden py-2 font-mono text-xs uppercase tracking-[.06em] text-ink-3 sm:grid')}>
                        <span role="columnheader">{t('colDate')}</span>
                        <span role="columnheader">{t('colPlan')}</span>
                        <span role="columnheader">{t('colAmount')}</span>
                        <span role="columnheader" className="sr-only">
                            {t('receipt')}
                        </span>
                    </div>
                    {payments.map((p) => (
                        <div role="row" key={p.id} className={row}>
                            <span role="cell">
                                {p.completed_at ? format.dateTime(new Date(p.completed_at), { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </span>
                            <span role="cell">{p.plan_name}</span>
                            <span role="cell" className="tabular-nums">
                                {tnd(p.amount_millimes, locale)} DT
                            </span>
                            <span role="cell">
                                <Link
                                    href={`/settings/billing/receipts/${p.id}`}
                                    aria-label={t('receiptOf', { no: p.receipt_no })}
                                    className="inline-flex h-[34px] items-center gap-1.5 rounded-[10px] border border-line-strong bg-white px-3 text-[13px] font-semibold text-ink-2 no-underline hover:text-ink"
                                >
                                    <Icon name="file" size={14} />
                                    {t('receipt')}
                                </Link>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

// BillingScreen is « Abonnement »: the plan the student has, the way to subscribe or add time, the receipts, and
// the page Flouci sends the browser back to.
export default function BillingScreen() {
    const t = useTranslations('billing')
    const tc = useTranslations('common')
    const locale = useLocale()
    const format = useFormatter()
    const length = useLength()
    const router = useRouter()
    const params = useSearchParams()
    const sub = useMySubscription()
    const plans = usePlans()
    const payments = usePayments()
    const renewal = useSetRenewal()
    const toast = useToast()
    const [adding, setAdding] = useState(false)
    const [confirming, setConfirming] = useState(false)
    // The plan the student picked (none yet: the one they had, else the shortest), and a plan to change to.
    const [chosenId, setChosenId] = useState('')
    const [switchTo, setSwitchTo] = useState<Plan | null>(null)

    const back = fromReturn(params)
    const offered = paidPlans(plans.data?.items)
    const lapsedId = sub.data?.lapsed?.plan_id
    const plan = offered.find((p) => p.id === chosenId) ?? offered.find((p) => p.id === lapsedId) ?? offered[0]
    const main = 'mx-auto box-border flex w-full max-w-[1180px] flex-1 flex-col gap-7 px-4 sm:px-8 pb-[72px] pt-6'

    if (back) {
        return (
            <main className={cn(main, 'pt-12')}>
                <Back back={back} plan={plan} onRetry={() => router.replace('/settings/billing')} />
            </main>
        )
    }
    if (sub.isLoading || plans.isLoading) {
        return (
            <main aria-busy="true" className={main}>
                <Sk className="h-12 w-[60%] rounded-lg" />
                <Sk className="h-[360px] w-full rounded-3xl" />
            </main>
        )
    }
    if (sub.isError || !sub.data) {
        return (
            <main className={main}>
                <h1 className="m-0 text-[30px] sm:text-[40px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p role="alert" className="m-0 text-base text-ink-3">
                    {tc('error')}
                </p>
                <Button className="self-start" onClick={() => sub.refetch()}>
                    {tc('retry')}
                </Button>
            </main>
        )
    }

    const active = sub.data.subscription && !sub.data.is_free ? sub.data : null
    // A lapsed student renewing the same plan within KEEP_DAYS keeps their launch price.
    const keptLapsed = !!plan && sub.data.kept_price != null && sub.data.lapsed?.plan_id === plan.id
    if (!active) {
        return (
            <main className={main}>
                <div className="flex flex-col gap-3">
                    <h1 className="m-0 max-w-[760px] text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{t('sellTitle')}</h1>
                    <p className="m-0 max-w-[700px] text-[17px] leading-[1.55] text-ink-3">{t('sellText')}</p>
                </div>
                {sub.data.lapsed ? (
                    <p role="status" className="m-0 rounded-[14px] bg-warn-bg px-4 py-3 text-[15px] leading-[1.55] text-warn-fg">
                        {t('lapsed', { date: format.dateTime(new Date(sub.data.lapsed.ends_at), { day: 'numeric', month: 'long', year: 'numeric' }) })}
                        {keptLapsed ? (
                            <>
                                {' '}
                                {t('launchKeptUntil', {
                                    date: format.dateTime(new Date(new Date(sub.data.lapsed.ends_at).getTime() + KEEP_DAYS * 86400000), {
                                        day: 'numeric',
                                        month: 'long',
                                    }),
                                })}
                            </>
                        ) : null}
                    </p>
                ) : null}
                {plan ? (
                    <Pay
                        key={plan.id}
                        plan={keptLapsed ? atKeptPrice(plan, sub.data.kept_price) : plan}
                        extending={null}
                        choice={offered.length > 1 ? <PlanChoice plans={offered} chosen={plan} onChoose={(p) => setChosenId(p.id)} /> : undefined}
                    />
                ) : (
                    <p className="m-0 rounded-2xl bg-fill-3 p-5 text-base text-ink-2">{t('noPlan')}</p>
                )}
                {payments.data?.length ? <Receipts payments={payments.data} /> : null}
            </main>
        )
    }

    const subscription = active.subscription!
    const ends = new Date(subscription.ends_at)
    const left = daysLeft(subscription.ends_at)
    // The plan they have, if it is still offered, at the launch price they keep when they keep one.
    const own = offered.find((p) => p.id === active.plan.id)
    const same = own ? atKeptPrice(own, active.kept_price) : undefined
    const others = offered.filter((p) => p.id !== active.plan.id)
    const date = format.dateTime(ends, { day: 'numeric', month: 'long', year: 'numeric' })
    const shortDate = format.dateTime(ends, { day: 'numeric', month: 'long' })
    const due = subscription.renews && left <= RENEW_DAYS
    const set = (renews: boolean) =>
        renewal.mutate(renews, {
            onSuccess: () => {
                setConfirming(false)
                toast(t(renews ? 'resumed' : 'stopped', { date: shortDate }))
            },
            onError: () => toast(tc('error')),
        })
    const price = `${dinars(active.plan.price, locale)} DT`
    return (
        <main className={cn(main, 'max-w-[900px]')}>
            <h1 className="m-0 text-[30px] sm:text-[40px] font-extrabold leading-[1.05]">{t('title')}</h1>
            {subscription.renews ? (
                <section className="flex flex-col gap-[18px] rounded-[20px] border-[1.5px] border-ink bg-white p-6 shadow-card">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="inline-flex h-6 items-center gap-1.5 self-start rounded-full bg-ok-bg px-2.5 text-[12.5px] font-semibold text-ok-fg">
                                <span className="h-1.5 w-1.5 rounded-full bg-ok-dot" />
                                {t('active')}
                            </span>
                            <h2 className="m-0 text-[26px] font-extrabold">{planText(active.plan, locale).label}</h2>
                            <span className="text-[15px] text-ink-3">
                                {t.rich('renewsOn', {
                                    price: `${price} / ${length(active.plan.duration_days)}`,
                                    date,
                                    b: (c) => <strong className="font-semibold text-ink">{c}</strong>,
                                })}
                            </span>
                            {active.kept_price != null ? <span className="text-sm font-medium text-ok-fg">{t('launchKept')}</span> : null}
                        </div>
                        <div className="flex items-center gap-2.5 rounded-xl bg-fill-3 px-3.5 py-2.5 text-sm">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-soft text-violet-hover">
                                <Icon name="lock" size={13} />
                            </span>
                            {t('paidOnFlouci')}
                        </div>
                    </div>
                    <p className={cn('m-0 rounded-[14px] px-4 py-3 text-sm leading-[1.55]', due ? 'bg-warn-bg text-warn-fg' : 'bg-fill-3 text-ink-2')}>
                        {due ? t('renewSoon', { count: left, amount: price }) : t('renewNote')}
                    </p>
                    {!adding ? (
                        <div className="flex flex-wrap gap-2">
                            {same ? (
                                <Button variant={due ? 'primary' : 'secondary'} onClick={() => setAdding(true)}>
                                    {t('renewNow', { amount: price })}
                                </Button>
                            ) : null}
                            <Button variant="link" className="px-3 text-sm font-semibold text-ink-3 hover:text-ink" onClick={() => setConfirming(true)}>
                                {t('stop')}
                            </Button>
                        </div>
                    ) : null}
                    {own ? null : <p className="m-0 text-sm leading-[1.55] text-ink-2">{t('planGone', { date: shortDate })}</p>}
                </section>
            ) : (
                <section className={panel}>
                    <span className="inline-flex h-6 items-center self-start rounded-full bg-fill px-2.5 text-[12.5px] font-semibold text-ink-2">
                        {t('endsOn', { date: shortDate })}
                    </span>
                    <h2 className="m-0 text-2xl font-extrabold">{t('stoppedTitle')}</h2>
                    <span className="text-[15px] leading-[1.55] text-ink-3">{t('stoppedText', { date })}</span>
                    <Button className="self-start" disabled={renewal.isPending} onClick={() => set(true)}>
                        {t('resume')}
                    </Button>
                </section>
            )}
            <ConfirmDialog
                open={confirming}
                title={t('stopTitle')}
                confirmLabel={t('stopYes')}
                cancelLabel={t('keep')}
                busy={renewal.isPending}
                onConfirm={() => set(false)}
                onClose={() => setConfirming(false)}
            >
                {t('stopText', { date: shortDate })}
            </ConfirmDialog>
            {same && adding && subscription.renews ? <Pay plan={same} extending={active} /> : null}
            {others.length ? (
                <section className={panel}>
                    <h2 className="m-0 text-xl font-extrabold">{t('switchTitle')}</h2>
                    <p className="m-0 text-[15px] leading-[1.55] text-ink-3">{t('switchText')}</p>
                    <div className="flex flex-wrap gap-2">
                        {others.map((p) => (
                            <Button key={p.id} variant={switchTo?.id === p.id ? 'primary' : 'secondary'} onClick={() => setSwitchTo(p)}>
                                {t('switchTo', { name: p.name, price: `${dinars(p.price, locale)} DT / ${length(p.duration_days)}` })}
                            </Button>
                        ))}
                    </div>
                </section>
            ) : null}
            {switchTo ? <Pay key={switchTo.id} plan={switchTo} extending={null} /> : null}
            <Receipts payments={payments.data ?? []} />
        </main>
    )
}
