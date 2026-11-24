import { describe, expect, it } from 'vitest'
import { daysLeft, dinars, fromReturn, lines, millimes, months, paidPlan, promoReason, regularOf, renewal, tnd } from '@/components/billing/billing'
import type { Plan, Subscription } from '@/types/plan'

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
