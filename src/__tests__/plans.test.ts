import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'
import ar from '../../messages/ar.json'
import en from '../../messages/en.json'
import fr from '../../messages/fr.json'
import { dayOf, launchIsOver, planInput, price, promoInput, promoState, quotaKeys, stopped } from '@/components/admin/plans'
import { dayAt } from '@/components/billing/billing'
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

describe('the last day of the launch price', () => {
    it('is saved with the plan and needs a regular price to go back to', () => {
        expect(planInput(plan, { price: '35', regular: '50', until: '2027-01-31' })).toMatchObject({
            input: { price: 35, regular_price: 50, launch_ends_on: '2027-01-31' },
        })
        const open = planInput(plan, { price: '35', regular: '50', until: '' })
        expect('input' in open && 'launch_ends_on' in open.input).toBe(false)
        expect(planInput(plan, { price: '35', regular: '', until: '2027-01-31' })).toEqual({ error: 'untilNeedsRegular' })
        expect(planInput(plan, { price: '35', regular: '50', until: '31/01/2027' })).toEqual({ error: 'untilInvalid' })
    })
    it('is over from the next day in Tunis', () => {
        const launch = { regular_price: 50, launch_ends_on: '2027-01-31' }
        expect(launchIsOver(launch, new Date('2027-01-31T22:59:00Z'))).toBe(false)
        expect(launchIsOver(launch, new Date('2027-01-31T23:00:00Z'))).toBe(true)
        expect(launchIsOver({ regular_price: 50 }, new Date('2030-01-01T00:00:00Z'))).toBe(false)
    })
    it('is written in each language, for the admin and for the student', () => {
        const day = dayAt('2027-01-31') as Date
        const say = (locale: string, messages: typeof fr) => createTranslator({ locale, messages, timeZone: 'Africa/Tunis' })
        expect(say('fr', fr)('billing.launchPriceUntil', { day })).toBe('Prix de lancement jusqu’au 31 janvier')
        expect(say('en', en)('billing.launchPriceUntil', { day })).toBe('Launch price until January 31')
        expect(say('ar', ar)('billing.launchPriceUntil', { day })).toContain('31')
        expect(say('fr', fr)('admin.priceHintUntil', { price: '35', regular: '50', day })).toBe(
            'L’étudiant paie 35 DT jusqu’au 31 janvier 2027 inclus, puis 50 DT.',
        )
        expect(say('fr', fr)('admin.priceHintOver', { regular: '50', day })).toBe(
            'Le prix de lancement s’est terminé le 31 janvier 2027 : l’étudiant paie 50 DT.',
        )
    })
    it('is read as the same day everywhere', () => {
        expect(dayAt('2027-01-31')?.toISOString()).toBe('2027-01-31T12:00:00.000Z')
        expect(dayAt('')).toBeNull()
        expect(dayAt(undefined)).toBeNull()
        expect(dayAt('31/01/2027')).toBeNull()
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
