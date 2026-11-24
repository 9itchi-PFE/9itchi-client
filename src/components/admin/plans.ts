import type { Plan, PlanInput, PromoCode, PromoInput } from '@/types/plan'

// The free plan keeps this name in payments-api; the page writes it in the language of the admin.
export const FREE_PLAN = 'Free'

const TUNIS = 'Africa/Tunis'

// price reads what the admin typed as dinars: a comma or a point, up to three decimals. null: not a price.
export function price(typed: string): number | null {
    const s = typed.trim().replace(',', '.')
    if (!/^\d+(\.\d{1,3})?$/.test(s)) return null
    return Number(s)
}

// PriceError says why the two prices of a plan cannot be saved.
export type PriceError = 'priceInvalid' | 'regularInvalid' | 'regularBelow' | 'untilInvalid' | 'untilNeedsRegular'

// planInput builds what is saved for a plan from what was typed. The regular price is optional: empty means
// nothing is struck through. until is the last day of the launch price (optional); it needs a regular price to go
// back to. Everything else of the plan is sent back as it is (payments-api replaces the row).
export function planInput(plan: Plan, typed: { price: string; regular: string; until?: string }): { input: PlanInput } | { error: PriceError } {
    const paid = price(typed.price)
    if (paid === null) return { error: 'priceInvalid' }
    const until = (typed.until ?? '').trim()
    if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return { error: 'untilInvalid' }
    const input: PlanInput = { name: plan.name, price: paid, duration_days: plan.duration_days, quotas: plan.quotas, active: plan.active }
    if (typed.regular.trim() === '') return until ? { error: 'untilNeedsRegular' } : { input }
    const regular = price(typed.regular)
    if (regular === null) return { error: 'regularInvalid' }
    if (regular <= paid) return { error: 'regularBelow' }
    return { input: { ...input, regular_price: regular, ...(until ? { launch_ends_on: until } : {}) } }
}

// today is the current day in Tunis (YYYY-MM-DD).
export const today = (now = new Date()) => dayOf(now.toISOString())

// launchIsOver says whether the last day of a launch price is past: students now pay the regular price.
export function launchIsOver(plan: Pick<Plan, 'launch_ends_on' | 'regular_price'>, now = new Date()): boolean {
    return !!plan.launch_ends_on && !!plan.regular_price && today(now) > plan.launch_ends_on
}

// quotaKeys lists the limits payments-api checks, the known ones first, in the order of the page.
const KNOWN = ['resumes', 'cv_downloads', 'emails_per_month']
export function quotaKeys(plans: Pick<Plan, 'quotas'>[]): string[] {
    const all = new Set(plans.flatMap((p) => Object.keys(p.quotas ?? {})))
    return [...KNOWN.filter((k) => all.has(k)), ...[...all].filter((k) => !KNOWN.includes(k)).sort()]
}

// PromoState is where a code stands now: usable, not started, past its last day, or used as often as allowed.
export type PromoState = 'active' | 'upcoming' | 'expired' | 'usedUp'

export function promoState(p: Pick<PromoCode, 'valid_from' | 'valid_until' | 'usage_limit' | 'used_count'>, now = new Date()): PromoState {
    if (now.getTime() >= new Date(p.valid_until).getTime()) return 'expired'
    if (p.usage_limit > 0 && p.used_count >= p.usage_limit) return 'usedUp'
    if (now.getTime() < new Date(p.valid_from).getTime()) return 'upcoming'
    return 'active'
}

// dayOf writes an instant as the day it is in Tunis (YYYY-MM-DD), for a date field.
export function dayOf(iso: string): string {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: TUNIS, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

// A code is valid from the start of its first day to the end of its last day, in Tunis (UTC+1 all year).
export const startOfDay = (day: string) => `${day}T00:00:00+01:00`
export const endOfDay = (day: string) => `${day}T23:59:59+01:00`

export type PromoError = 'codeInvalid' | 'valueInvalid' | 'percentRange' | 'datesInvalid' | 'limitInvalid'

export type PromoTyped = { code: string; type: string; value: string; from: string; until: string; limit: string }

// promoInput builds what is saved for a code from the form. plan_ids are kept from the code being edited (empty:
// every plan).
export function promoInput(typed: PromoTyped, planIds: string[] = []): { input: PromoInput } | { error: PromoError } {
    const code = typed.code.trim().toUpperCase()
    if (!/^[A-Z0-9][A-Z0-9_-]{2,63}$/.test(code)) return { error: 'codeInvalid' }
    const type = typed.type === 'percentage' ? 'percentage' : 'fixed'
    const value = price(typed.value)
    if (value === null || value <= 0) return { error: 'valueInvalid' }
    if (type === 'percentage' && (value < 1 || value > 100)) return { error: 'percentRange' }
    const day = /^\d{4}-\d{2}-\d{2}$/
    if (!day.test(typed.from) || !day.test(typed.until) || typed.from > typed.until) return { error: 'datesInvalid' }
    const limit = typed.limit.trim() === '' ? 0 : Number(typed.limit)
    if (!Number.isInteger(limit) || limit < 0) return { error: 'limitInvalid' }
    return { input: { code, type, value, valid_from: startOfDay(typed.from), valid_until: endOfDay(typed.until), usage_limit: limit, plan_ids: planIds } }
}

// stopped is the same code ending now: nobody can use it any more, and what it already gave stays.
export function stopped(p: PromoCode, now = new Date()): PromoInput {
    return {
        code: p.code,
        type: p.type,
        value: p.value,
        valid_from: p.valid_from,
        valid_until: now.toISOString(),
        usage_limit: p.usage_limit,
        plan_ids: p.plan_ids,
    }
}
