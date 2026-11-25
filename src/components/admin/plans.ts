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

// COUNTS are the limits written as a number: empty sets no limit, 0 allows none.
export const COUNTS = ['resumes', 'cv_downloads', 'emails_per_month'] as const
// SHOWN are the groups of the CV diagnosis a plan shows or hides (ats_<group> = 0 hides it).
export const SHOWN = ['ats_contact', 'ats_summary', 'ats_experience', 'ats_education', 'ats_skills', 'ats_layout', 'ats_file'] as const
export type CountKey = (typeof COUNTS)[number]
export type ShownKey = (typeof SHOWN)[number]

// countOf reads a number limit as the field shows it: '' when the plan sets none.
export const countOf = (quotas: Record<string, number> | undefined, key: string) => (quotas && key in quotas ? String(quotas[key]) : '')

// shows says whether a plan shows a group of the diagnosis: hidden only when its key is 0.
export const shows = (quotas: Record<string, number> | undefined, key: string) => !(quotas && key in quotas && quotas[key] === 0)

// withCount writes a number limit: an empty field removes the key (no limit). null: not a whole number from 0.
export function withCount(quotas: Record<string, number>, key: string, typed: string): Record<string, number> | null {
    const next = { ...quotas }
    const s = typed.trim()
    if (s === '') {
        delete next[key]
        return next
    }
    if (!/^\d{1,6}$/.test(s)) return null
    next[key] = Number(s)
    return next
}

// withShown shows or hides a group of the diagnosis; shown is written as no key, so that it reads "no limit".
export function withShown(quotas: Record<string, number>, key: string, shown: boolean): Record<string, number> {
    const next = { ...quotas }
    if (shown) delete next[key]
    else next[key] = 0
    return next
}

// quotasInput is what is saved when only the limits of a plan change: payments-api replaces the row, so the
// prices and the end of the launch price are sent back as they are.
export function quotasInput(plan: Plan, quotas: Record<string, number>): PlanInput {
    return {
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days,
        quotas,
        active: plan.active,
        ...(plan.regular_price ? { regular_price: plan.regular_price } : {}),
        ...(plan.regular_price && plan.launch_ends_on ? { launch_ends_on: plan.launch_ends_on } : {}),
    }
}

// sameQuotas says whether two sets of limits are the same.
export const sameQuotas = (a: Record<string, number> = {}, b: Record<string, number> = {}) => {
    const ka = Object.keys(a)
    return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k])
}

// quotaKeys lists the limits payments-api checks, the known ones first, in the order of the page.
const KNOWN: string[] = [...COUNTS, ...SHOWN]
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
