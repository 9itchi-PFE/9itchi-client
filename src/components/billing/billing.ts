import type { MySubscription, Payment, Plan } from '@/types/plan'

// millimes turns a price in TND into integer millimes, the unit payments-api counts in.
export const millimes = (tnd: number) => Math.round(tnd * 1000)

// tnd writes millimes as dinars with three decimals, with the decimal sign of the language (35,000 or 35.000).
export function tnd(m: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-TN-u-nu-latn' : locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(m / 1000)
}

// dinars writes a price for a headline: 35 or 35,5, without trailing zeros.
export function dinars(price: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-TN-u-nu-latn' : locale, { maximumFractionDigits: 3 }).format(price)
}

// paidPlan is the plan the subscribe screen sells: the cheapest active paid one.
export function paidPlan(plans: Plan[] | undefined): Plan | undefined {
    return plans?.filter((p) => p.active && p.price > 0).sort((a, b) => a.price - b.price)[0]
}

// paidPlans are the plans a student can buy, shortest first (the monthly plan, then the longer ones).
export function paidPlans(plans: Plan[] | undefined): Plan[] {
    return (plans ?? []).filter((p) => p.active && p.price > 0).sort((a, b) => a.duration_days - b.duration_days || a.price - b.price)
}

// lengthOf says how a period is counted on screen: in years (365 days), in months (30 days), else in days.
export function lengthOf(days: number): { unit: 'years' | 'months' | 'days'; count: number } {
    if (days > 0 && days % 365 === 0) return { unit: 'years', count: days / 365 }
    if (days > 0 && days % 30 === 0) return { unit: 'months', count: days / 30 }
    return { unit: 'days', count: days }
}

// perMonth is what a plan longer than a month comes to per month (30 days), in dinars; null for a month or less.
export function perMonth(plan: Pick<Plan, 'price' | 'duration_days'>): number | null {
    return plan.duration_days > 30 ? Math.round((plan.price * 30 * 1000) / plan.duration_days) / 1000 : null
}

// months says how long a plan lasts when that is a whole number of months (30 days = 1), else null: the screen then counts in days.
export function months(days: number): number | null {
    return days > 0 && days % 30 === 0 ? days / 30 : null
}

// regularOf is the price to strike through, in millimes: the regular price when it is above the price charged, else null.
export function regularOf(plan: Pick<Plan, 'price' | 'regular_price'>): number | null {
    return plan.regular_price && plan.regular_price > plan.price ? millimes(plan.regular_price) : null
}

// dayAt reads a day (YYYY-MM-DD) as a date at noon UTC: the same day wherever it is written. null: not a day.
export function dayAt(day: string | null | undefined): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? '')
    const at = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)) : null
    return at && !Number.isNaN(at.getTime()) ? at : null
}

// Lines are the rows of a receipt, in millimes: the plan at its price, what the code took off, what was paid.
// launch is what the launch price took off the regular price that day (0 when the plan had no regular price):
// the first row then shows price + launch.
export type Lines = { price: number; launch: number; discount: number; paid: number }

export function lines(p: Pick<Payment, 'amount_millimes' | 'discount_millimes' | 'regular_millimes'>): Lines {
    const price = p.amount_millimes + p.discount_millimes
    const launch = p.regular_millimes && p.regular_millimes > price ? p.regular_millimes - price : 0
    return { price, launch, discount: p.discount_millimes, paid: p.amount_millimes }
}

// promoReason turns payments-api's refusal of a code into the key of the message shown.
export type PromoReason = 'promoDuringSale' | 'promoExpired' | 'promoNotYet' | 'promoUsedUp' | 'promoOtherPlan' | 'promoUnknown'

export function promoReason(reason = ''): PromoReason {
    const r = reason.toLowerCase()
    if (r.includes('during a sale')) return 'promoDuringSale'
    if (r.includes('expired')) return 'promoExpired'
    if (r.includes('not yet') || r.includes('not valid yet')) return 'promoNotYet'
    if (r.includes('limit')) return 'promoUsedUp'
    if (r.includes('plan')) return 'promoOtherPlan'
    return 'promoUnknown'
}

// Outcome is what the browser came back from Flouci with. It is only a hint: payments-api says what happened.
export type Return = { outcome: 'success' | 'failed'; id: string }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function fromReturn(params: { get: (k: string) => string | null }): Return | null {
    const outcome = params.get('payment')
    const id = params.get('id') ?? ''
    if ((outcome !== 'success' && outcome !== 'failed') || !uuid.test(id)) return null
    return { outcome, id }
}

// daysLeft counts the days until the subscription ends (0 on the last day).
export function daysLeft(endsAt: string, now = new Date()): number {
    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 86_400_000))
}

// RENEW_DAYS is how long before the end the renewal is put forward (banner, main button).
export const RENEW_DAYS = 7
// KEEP_DAYS: a student who renews at most this many days after the end keeps their launch price (payments-api).
export const KEEP_DAYS = 7

// Renewal says what the student should know about their subscription right now, if anything:
// due: it renews and ends within RENEW_DAYS; lapsed: it ended unpaid without having been stopped.
export type Renewal = { kind: 'due'; endsAt: string; days: number } | { kind: 'lapsed'; endedAt: string } | null

export function renewal(s: Pick<MySubscription, 'subscription' | 'is_free' | 'lapsed'> | undefined, now = new Date()): Renewal {
    if (!s) return null
    if (s.subscription && !s.is_free) {
        const days = daysLeft(s.subscription.ends_at, now)
        return s.subscription.renews && days <= RENEW_DAYS ? { kind: 'due', endsAt: s.subscription.ends_at, days } : null
    }
    return s.lapsed ? { kind: 'lapsed', endedAt: s.lapsed.ends_at } : null
}
