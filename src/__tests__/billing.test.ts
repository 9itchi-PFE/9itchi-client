import { describe, expect, it } from 'vitest'
import {
    daysLeft,
    dinars,
    fromReturn,
    lengthOf,
    lines,
    millimes,
    months,
    paidPlan,
    paidPlans,
    perMonth,
    planText,
    promoReason,
    regularOf,
    renewal,
    tnd,
} from '@/components/billing/billing'
import { atKeptPrice, type Plan, type Subscription } from '@/types/plan'

const plan = (over: Partial<Plan>): Plan => ({ id: 'p', name: 'Mensuel', price: 35, duration_days: 30, quotas: {}, active: true, ...over })

describe('amounts', () => {
    it('counts in millimes and writes three decimals', () => {
        expect(millimes(35)).toBe(35000)
        expect(millimes(29.99)).toBe(29990)
        expect(tnd(35000, 'en')).toBe('35.000')
        expect(tnd(30500, 'fr')).toBe('30,500')
        expect(tnd(35000, 'ar')).toMatch(/^35[.,٫]000$/)
        expect(dinars(35, 'fr')).toBe('35')
        expect(dinars(35.5, 'fr')).toBe('35,5')
    })
    it('splits a receipt into price, discount and paid', () => {
        expect(lines({ amount_millimes: 30000, discount_millimes: 5000 })).toEqual({ price: 35000, launch: 0, discount: 5000, paid: 30000 })
        expect(lines({ amount_millimes: 0, discount_millimes: 35000 })).toEqual({ price: 35000, launch: 0, discount: 35000, paid: 0 })
    })
})

describe('plans', () => {
    it('sells the cheapest active paid plan', () => {
        const plans = [plan({ id: 'free', price: 0 }), plan({ id: 'year', price: 300 }), plan({ id: 'month' }), plan({ id: 'off', price: 10, active: false })]
        expect(paidPlan(plans)?.id).toBe('month')
        expect(paidPlan([plan({ price: 0 })])).toBeUndefined()
        expect(paidPlan(undefined)).toBeUndefined()
    })
    it('counts in months only for whole months', () => {
        expect(months(30)).toBe(1)
        expect(months(90)).toBe(3)
        expect(months(45)).toBeNull()
        expect(months(0)).toBeNull()
    })
    it('counts the days left', () => {
        const now = new Date('2026-11-24T12:00:00Z')
        expect(daysLeft('2026-12-24T12:00:00Z', now)).toBe(30)
        expect(daysLeft('2026-11-24T18:00:00Z', now)).toBe(1)
        expect(daysLeft('2026-11-20T00:00:00Z', now)).toBe(0)
    })
})

describe('promoReason', () => {
    it('reads why payments-api refused a code', () => {
        expect(promoReason('promo codes cannot be used during a sale')).toBe('promoDuringSale')
        expect(promoReason('promo code has expired')).toBe('promoExpired')
        expect(promoReason('promo code is not yet valid')).toBe('promoNotYet')
        expect(promoReason('promo code usage limit reached')).toBe('promoUsedUp')
        expect(promoReason('promo code does not apply to this plan')).toBe('promoOtherPlan')
        expect(promoReason('invalid promo code')).toBe('promoUnknown')
        expect(promoReason()).toBe('promoUnknown')
    })
})

describe('fromReturn', () => {
    const q = (s: string) => new URLSearchParams(s)
    const id = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
    it('only takes a known outcome with a payment id', () => {
        expect(fromReturn(q(`payment=success&id=${id}`))).toEqual({ outcome: 'success', id })
        expect(fromReturn(q(`payment=failed&id=${id}`))).toEqual({ outcome: 'failed', id })
        expect(fromReturn(q(`payment=paid&id=${id}`))).toBeNull()
        expect(fromReturn(q('payment=success&id=../admin'))).toBeNull()
        expect(fromReturn(q('payment=success'))).toBeNull()
        expect(fromReturn(q(''))).toBeNull()
    })
})

describe('renewal', () => {
    const now = new Date('2026-11-24T12:00:00Z')
    const sub = (over: Partial<Subscription>): Subscription => ({
        id: 's',
        plan_id: 'p',
        status: 'active',
        amount: 35,
        starts_at: '2026-11-01T12:00:00Z',
        ends_at: '2026-11-28T12:00:00Z',
        renews: true,
        stopped_at: null,
        ...over,
    })
    it('is due in the last days of a subscription that renews', () => {
        expect(renewal({ subscription: sub({}), is_free: false }, now)).toEqual({ kind: 'due', endsAt: '2026-11-28T12:00:00Z', days: 4 })
        expect(renewal({ subscription: sub({ ends_at: '2026-12-20T12:00:00Z' }), is_free: false }, now)).toBeNull()
    })
    it('asks nothing once the student stopped it', () => {
        expect(renewal({ subscription: sub({ renews: false, stopped_at: '2026-11-20T00:00:00Z' }), is_free: false }, now)).toBeNull()
        expect(renewal({ subscription: null, is_free: true, lapsed: null }, now)).toBeNull()
    })
    it('says a subscription lapsed when it ended unpaid', () => {
        const lapsed = sub({ ends_at: '2026-11-20T12:00:00Z' })
        expect(renewal({ subscription: null, is_free: true, lapsed }, now)).toEqual({ kind: 'lapsed', endedAt: '2026-11-20T12:00:00Z' })
        expect(renewal(undefined, now)).toBeNull()
    })
})

describe('regular price', () => {
    it('is struck through only when it is above the price charged', () => {
        expect(regularOf({ price: 35, regular_price: 50 })).toBe(50000)
        expect(regularOf({ price: 35, regular_price: 35 })).toBeNull()
        expect(regularOf({ price: 35, regular_price: 20 })).toBeNull()
        expect(regularOf({ price: 35, regular_price: null })).toBeNull()
        expect(regularOf({ price: 35 })).toBeNull()
    })

    it('adds a launch-price row to the receipt of a payment opened with one', () => {
        // 50 regular, 35 at launch, 5 off with a code: 30 paid.
        expect(lines({ amount_millimes: 30000, discount_millimes: 5000, regular_millimes: 50000 })).toEqual({
            price: 35000,
            launch: 15000,
            discount: 5000,
            paid: 30000,
        })
    })

    it('adds none for a payment opened without one', () => {
        expect(lines({ amount_millimes: 30000, discount_millimes: 5000 })).toEqual({ price: 35000, launch: 0, discount: 5000, paid: 30000 })
        expect(lines({ amount_millimes: 35000, discount_millimes: 0, regular_millimes: 35000 }).launch).toBe(0)
    })
})

describe('atKeptPrice', () => {
    const plan: Plan = { id: 'p', name: 'Mensuel', price: 50, duration_days: 30, quotas: {}, active: true }
    it('shows the kept launch price with today’s price struck through', () => {
        expect(atKeptPrice(plan, 35)).toMatchObject({ price: 35, regular_price: 50 })
    })
    it('keeps the highest usual price during a sale and drops the sale', () => {
        const inSale: Plan = { ...plan, price: 45, regular_price: 50, sale: { name: 'Rentrée', percent: 10, ends_on: '2027-02-05' } }
        const kept = atKeptPrice(inSale, 35)
        expect(kept).toMatchObject({ price: 35, regular_price: 50 })
        expect(kept.sale).toBeUndefined()
    })
    it('changes nothing when nothing is kept or today is cheaper', () => {
        expect(atKeptPrice(plan, null)).toBe(plan)
        expect(atKeptPrice(plan, undefined)).toBe(plan)
        expect(atKeptPrice({ ...plan, price: 30 }, 35).price).toBe(30)
    })
})

describe('a month and a year', () => {
    const month = plan({ id: 'm' })
    const year = plan({ id: 'y', name: 'Annuel', price: 350, duration_days: 365 })
    const off = plan({ id: 'o', price: 20, active: false })
    const free = plan({ id: 'f', name: 'Free', price: 0, duration_days: 36500 })

    it('offers the paid plans that are on, shortest first', () => {
        expect(paidPlans([year, free, off, month]).map((p) => p.id)).toEqual(['m', 'y'])
        expect(paidPlans(undefined)).toEqual([])
    })

    it('counts a period in years, months or days', () => {
        expect(lengthOf(365)).toEqual({ unit: 'years', count: 1 })
        expect(lengthOf(90)).toEqual({ unit: 'months', count: 3 })
        expect(lengthOf(45)).toEqual({ unit: 'days', count: 45 })
    })

    it('says what a longer plan comes to per month', () => {
        expect(perMonth(year)).toBe(28.767)
        expect(perMonth(month)).toBeNull()
    })
})

describe('planText', () => {
    const details = { fr: { label: 'Mensuel', tagline: 'Rapide', features: ['A', 'B'] }, en: { label: 'Monthly' } }
    it('reads each field in the language of the student', () => {
        expect(planText({ name: 'M', details }, 'en')).toEqual({ label: 'Monthly', tagline: 'Rapide', features: ['A', 'B'] })
        expect(planText({ name: 'M', details }, 'fr')).toEqual({ label: 'Mensuel', tagline: 'Rapide', features: ['A', 'B'] })
    })
    it('falls back to French, then to the plan name', () => {
        expect(planText({ name: 'M', details }, 'ar').label).toBe('Mensuel')
        expect(planText({ name: 'M', details: {} }, 'ar')).toEqual({ label: 'M', tagline: '', features: [] })
        expect(planText({ name: 'M' }, 'fr')).toEqual({ label: 'M', tagline: '', features: [] })
    })
})

describe('student discount', () => {
    it('takes the percentage off what is left, rounded down like payments-api', async () => {
        const { studentOff } = await import('@/components/billing/billing')
        expect(studentOff(50000, 10)).toBe(5000)
        expect(studentOff(40000, 10)).toBe(4000)
        expect(studentOff(33333, 15)).toBe(4999)
        expect(studentOff(50000, 0)).toBe(0)
        expect(studentOff(0, 20)).toBe(0)
        expect(studentOff(50000, 150)).toBe(50000)
    })
    it('reads the domains the admin typed', async () => {
        const { domainsOf } = await import('@/components/billing/billing')
        expect(domainsOf(' @ENIS.tn\n.enis.tn, etudiant-isi.utm.tn;\n\n')).toEqual(['enis.tn', 'etudiant-isi.utm.tn'])
        expect(domainsOf('')).toEqual([])
    })
})
