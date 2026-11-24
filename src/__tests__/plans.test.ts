import { describe, expect, it } from 'vitest'
import { dayOf, planInput, price, promoInput, promoState, quotaKeys, stopped } from '@/components/admin/plans'
import type { Plan, PromoCode } from '@/types/plan'

const plan: Plan = { id: 'p1', name: 'Abonnement étudiant', price: 35, regular_price: 50, duration_days: 30, quotas: { resumes: 50 }, active: true }
const promo: PromoCode = {
    id: 'c1',
    code: 'ENIS2027',
    type: 'fixed',
    value: 5,
    valid_from: '2026-01-01T00:00:00+01:00',
    valid_until: '2027-01-31T23:59:59+01:00',
    usage_limit: 200,
    used_count: 86,
    plan_ids: ['p1'],
}

describe('price', () => {
    it('reads dinars with a comma or a point, up to three decimals', () => {
        expect(price('35')).toBe(35)
        expect(price(' 35,5 ')).toBe(35.5)
        expect(price('0.005')).toBe(0.005)
        for (const bad of ['', 'abc', '-5', '35.1234', '1 000', '35 DT']) expect(price(bad)).toBeNull()
    })
})

describe('planInput', () => {
    it('sends the plan back whole with the two prices', () => {
        expect(planInput(plan, { price: '39', regular: '55' })).toEqual({
            input: { name: 'Abonnement étudiant', price: 39, regular_price: 55, duration_days: 30, quotas: { resumes: 50 }, active: true },
        })
    })
    it('leaves the regular price out when the field is empty: nothing is struck through', () => {
        const built = planInput(plan, { price: '35', regular: ' ' })
        expect('input' in built && 'regular_price' in built.input).toBe(false)
    })
    it('refuses a price it cannot read and a regular price that is not above', () => {
        expect(planInput(plan, { price: 'x', regular: '' })).toEqual({ error: 'priceInvalid' })
        expect(planInput(plan, { price: '35', regular: 'x' })).toEqual({ error: 'regularInvalid' })
        expect(planInput(plan, { price: '35', regular: '35' })).toEqual({ error: 'regularBelow' })
    })
})

describe('quotaKeys', () => {
    it('lists the known limits first, then the others by name', () => {
        expect(quotaKeys([{ quotas: { zeta: 1, emails_per_month: 0, resumes: 1 } }, { quotas: { cv_downloads: 5, alpha: 2 } }])).toEqual([
            'resumes',
            'cv_downloads',
            'emails_per_month',
            'alpha',
            'zeta',
        ])
        expect(quotaKeys([])).toEqual([])
    })
})

describe('promoState', () => {
    const at = (iso: string) => new Date(iso)
    it('says where a code stands', () => {
        expect(promoState(promo, at('2026-11-24T12:00:00Z'))).toBe('active')
        expect(promoState(promo, at('2025-12-01T12:00:00Z'))).toBe('upcoming')
        expect(promoState(promo, at('2027-02-01T12:00:00Z'))).toBe('expired')
        expect(promoState({ ...promo, used_count: 200 }, at('2026-11-24T12:00:00Z'))).toBe('usedUp')
        // No limit: never used up.
        expect(promoState({ ...promo, usage_limit: 0, used_count: 999 }, at('2026-11-24T12:00:00Z'))).toBe('active')
    })
})

describe('promoInput', () => {
    const typed = { code: ' enis-2027 ', type: 'percentage', value: '10', from: '2026-12-01', until: '2027-01-31', limit: '' }
    it('builds the code in capitals, valid from the start of the first day to the end of the last, in Tunis', () => {
        expect(promoInput(typed, ['p1'])).toEqual({
            input: {
                code: 'ENIS-2027',
                type: 'percentage',
                value: 10,
                valid_from: '2026-12-01T00:00:00+01:00',
                valid_until: '2027-01-31T23:59:59+01:00',
                usage_limit: 0,
                plan_ids: ['p1'],
            },
        })
        expect(promoInput({ ...typed, from: '2026-12-01', until: '2026-12-01', limit: '10' })).toMatchObject({ input: { usage_limit: 10 } })
    })
    it('says what cannot be saved', () => {
        expect(promoInput({ ...typed, code: 'ab' })).toEqual({ error: 'codeInvalid' })
        expect(promoInput({ ...typed, code: 'promo été' })).toEqual({ error: 'codeInvalid' })
        expect(promoInput({ ...typed, value: '0' })).toEqual({ error: 'valueInvalid' })
        expect(promoInput({ ...typed, value: '120' })).toEqual({ error: 'percentRange' })
        expect(promoInput({ ...typed, type: 'fixed', value: '120' })).toMatchObject({ input: { type: 'fixed', value: 120 } })
        expect(promoInput({ ...typed, until: '2026-11-30' })).toEqual({ error: 'datesInvalid' })
        expect(promoInput({ ...typed, until: '' })).toEqual({ error: 'datesInvalid' })
        expect(promoInput({ ...typed, limit: '2.5' })).toEqual({ error: 'limitInvalid' })
    })
})

describe('dayOf and stopped', () => {
    it('writes an instant as its day in Tunis', () => {
        expect(dayOf('2027-01-31T23:59:59+01:00')).toBe('2027-01-31')
        expect(dayOf('2026-12-31T23:30:00Z')).toBe('2027-01-01')
        expect(dayOf('nope')).toBe('')
    })
    it('ends a code now and keeps the rest', () => {
        const now = new Date('2026-11-24T20:00:00Z')
        expect(stopped(promo, now)).toEqual({
            code: 'ENIS2027',
            type: 'fixed',
            value: 5,
            valid_from: promo.valid_from,
            valid_until: '2026-11-24T20:00:00.000Z',
            usage_limit: 200,
            plan_ids: ['p1'],
        })
        expect(promoState({ ...promo, ...stopped(promo, now) }, now)).toBe('expired')
    })
})
