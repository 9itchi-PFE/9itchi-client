import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'
import ar from '../../messages/ar.json'
import en from '../../messages/en.json'
import fr from '../../messages/fr.json'
import {
    countOf,
    dayOf,
    detailsInput,
    detailsTyped,
    emptyDetails,
    launchIsOver,
    newPlanInput,
    planInput,
    price,
    promoInput,
    promoState,
    quotaKeys,
    quotasInput,
    renamedInput,
    sameQuotas,
    shows,
    stopped,
    switchedOn,
    withCount,
    withShown,
    inSale,
    saleInput,
    salePrice,
} from '@/components/admin/plans'
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
        expect(planInput(plan, { price: '0', regular: '' })).toEqual({ error: 'priceZero' })
        expect(planInput({ ...plan, name: 'Free', price: 0, regular_price: undefined }, { price: '0', regular: '' })).toMatchObject({ input: { price: 0 } })
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
        expect(
            quotaKeys([{ quotas: { zeta: 1, recruiter_searches_per_day: 6, emails_per_month: 0, resumes: 1 } }, { quotas: { cv_downloads: 5, alpha: 2 } }]),
        ).toEqual(['resumes', 'cv_downloads', 'emails_per_month', 'recruiter_searches_per_day', 'alpha', 'zeta'])
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

describe('what each plan allows', () => {
    const plan = {
        id: 'p',
        name: 'Mensuel',
        price: 35,
        regular_price: 50,
        launch_ends_on: '2026-12-31',
        duration_days: 30,
        quotas: { resumes: 3 },
        active: true,
    }

    it('reads a number limit: empty when the plan sets none', () => {
        expect(countOf({ cv_downloads: 0 }, 'cv_downloads')).toBe('0')
        expect(countOf({ cv_downloads: 5 }, 'cv_downloads')).toBe('5')
        expect(countOf({}, 'cv_downloads')).toBe('')
        expect(countOf(undefined, 'cv_downloads')).toBe('')
    })
    it('writes a number limit: empty removes it, 0 allows none, anything else is refused', () => {
        expect(withCount({ resumes: 1 }, 'cv_downloads', ' 5 ')).toEqual({ resumes: 1, cv_downloads: 5 })
        expect(withCount({ cv_downloads: 5 }, 'cv_downloads', '')).toEqual({})
        expect(withCount({}, 'cv_downloads', '0')).toEqual({ cv_downloads: 0 })
        for (const bad of ['-1', '2.5', 'cinq', '1e3', '1234567']) expect(withCount({}, 'cv_downloads', bad)).toBeNull()
    })
    it('shows a group of the diagnosis unless its key is 0', () => {
        expect(shows({}, 'ats_layout')).toBe(true)
        expect(shows({ ats_layout: 1 }, 'ats_layout')).toBe(true)
        expect(shows({ ats_layout: 0 }, 'ats_layout')).toBe(false)
        expect(withShown({ resumes: 1 }, 'ats_layout', false)).toEqual({ resumes: 1, ats_layout: 0 })
        expect(withShown({ ats_layout: 0 }, 'ats_layout', true)).toEqual({})
    })
    it('saves the limits without losing the prices of the plan', () => {
        expect(quotasInput(plan, { resumes: 3, cv_downloads: 5 })).toEqual({
            name: 'Mensuel',
            price: 35,
            duration_days: 30,
            quotas: { resumes: 3, cv_downloads: 5 },
            active: true,
            regular_price: 50,
            launch_ends_on: '2026-12-31',
        })
        expect(quotasInput({ ...plan, regular_price: null, launch_ends_on: undefined }, {})).toEqual({
            name: 'Mensuel',
            price: 35,
            duration_days: 30,
            quotas: {},
            active: true,
        })
    })
    it('knows when nothing changed', () => {
        expect(sameQuotas({ a: 1, b: 0 }, { b: 0, a: 1 })).toBe(true)
        expect(sameQuotas({ a: 1 }, { a: 1, b: 0 })).toBe(false)
        expect(sameQuotas({ a: 1 }, { a: 2 })).toBe(false)
        expect(sameQuotas(undefined, {})).toBe(true)
    })
})

describe('a sale', () => {
    const now = new Date('2027-02-10T09:00:00Z')
    const typed = { name: ' Rentrée ', percent: '30', from: '2027-02-15', until: '2027-02-28' }
    it('is built from the form', () => {
        expect(saleInput(typed, [], now)).toEqual({ input: { name: 'Rentrée', percent: 30, starts_on: '2027-02-15', ends_on: '2027-02-28', plan_ids: [] } })
        expect(saleInput({ ...typed, from: '2027-02-10', until: '2027-02-10' }, ['p1'], now)).toEqual({
            input: { name: 'Rentrée', percent: 30, starts_on: '2027-02-10', ends_on: '2027-02-10', plan_ids: ['p1'] },
        })
    })
    it('says what is wrong', () => {
        expect(saleInput({ ...typed, name: '  ' }, [], now)).toEqual({ error: 'saleNameInvalid' })
        expect(saleInput({ ...typed, name: 'x'.repeat(61) }, [], now)).toEqual({ error: 'saleNameInvalid' })
        for (const percent of ['0', '91', '12.5', 'dix', '']) expect(saleInput({ ...typed, percent }, [], now)).toEqual({ error: 'salePercentRange' })
        expect(saleInput({ ...typed, from: '2027-03-01' }, [], now)).toEqual({ error: 'datesInvalid' })
        expect(saleInput({ ...typed, until: '' }, [], now)).toEqual({ error: 'datesInvalid' })
        expect(saleInput({ ...typed, from: '2027-01-01', until: '2027-02-09' }, [], now)).toEqual({ error: 'saleOver' })
    })
    it('counts a day in Tunis', () => {
        // 23:30 UTC on the 9th is already the 10th in Tunis: a sale ending on the 9th is over.
        expect(saleInput({ ...typed, from: '2027-02-01', until: '2027-02-09' }, [], new Date('2027-02-09T23:30:00Z'))).toEqual({ error: 'saleOver' })
    })
    it('prices like payments-api: whole millimes, rounded down', () => {
        expect(salePrice(50, 30)).toBe(35)
        expect(salePrice(35, 30)).toBe(24.5)
        expect(salePrice(49.99, 33)).toBe(33.493)
        expect(salePrice(35, 90)).toBe(3.5)
    })
})

describe('a plan in a sale', () => {
    const launch = { price: 35, regular_price: 50, launch_ends_on: '2027-01-31' }
    it('takes the percentage off the regular price, never the launch price', () => {
        expect(inSale(launch, 40, new Date('2027-01-25T09:00:00Z'))).toEqual({ usual: 50, price: 30, kept: false })
    })
    it('keeps a launch price that is already lower', () => {
        expect(inSale(launch, 20, new Date('2027-01-25T09:00:00Z'))).toEqual({ usual: 50, price: 35, kept: true })
        expect(inSale(launch, 30, new Date('2027-01-25T09:00:00Z'))).toEqual({ usual: 50, price: 35, kept: true })
    })
    it('counts on the regular price once the launch is over', () => {
        expect(inSale(launch, 20, new Date('2027-02-02T09:00:00Z'))).toEqual({ usual: 50, price: 40, kept: false })
    })
    it('counts on the only price of a plan', () => {
        expect(inSale({ price: 50 }, 30)).toEqual({ usual: 50, price: 35, kept: false })
    })
})

describe('a new plan', () => {
    const free: Plan = { id: 'f', name: 'Free', price: 0, duration_days: 36500, quotas: { free_applications: 3, cv_edit: 0 }, active: true }
    const typed = { name: ' Abonnement 3 mois ', duration: '90', price: '90', regular: '120', until: '', active: true }

    it('takes the name, period and prices typed, and the limits of the plan it starts from', () => {
        const built = newPlanInput(typed, [free, plan], plan)
        expect(built).toEqual({
            input: { name: 'Abonnement 3 mois', price: 90, regular_price: 120, duration_days: 90, quotas: { resumes: 50 }, active: true },
        })
        if ('input' in built) expect(built.input.quotas).not.toBe(plan.quotas)
    })

    it('can be kept from students until it is ready', () => {
        const built = newPlanInput({ ...typed, active: false }, [plan])
        expect('input' in built && built.input.active).toBe(false)
        expect('input' in built && built.input.quotas).toEqual({})
    })

    it('refuses a name already used or Free, in any case, and an empty one', () => {
        expect(newPlanInput({ ...typed, name: 'abonnement ÉTUDIANT' }, [plan])).toEqual({ error: 'nameTaken' })
        expect(newPlanInput({ ...typed, name: 'free' }, [plan])).toEqual({ error: 'nameFree' })
        expect(newPlanInput({ ...typed, name: '  ' }, [plan])).toEqual({ error: 'nameMissing' })
    })

    it('refuses a free price, a missing period and the price errors of a plan', () => {
        expect(newPlanInput({ ...typed, price: '0' }, [])).toEqual({ error: 'priceZero' })
        expect(newPlanInput({ ...typed, duration: '' }, [])).toEqual({ error: 'durationInvalid' })
        expect(newPlanInput({ ...typed, regular: '80' }, [])).toEqual({ error: 'regularBelow' })
        expect(newPlanInput({ ...typed, regular: '', until: '2027-01-31' }, [])).toEqual({ error: 'untilNeedsRegular' })
    })
})

describe('a plan renamed or switched on', () => {
    it('changes only the name and the period', () => {
        const built = renamedInput(plan, { name: 'Mensuel', duration: '30' }, [plan])
        expect(built).toEqual({ input: { ...quotasInput(plan, plan.quotas), name: 'Mensuel', duration_days: 30 } })
    })

    it('may keep its own name, but not take another plan’s', () => {
        const other: Plan = { ...plan, id: 'p2', name: 'Annuel', duration_days: 365 }
        expect('input' in renamedInput(plan, { name: 'ABONNEMENT ÉTUDIANT', duration: '30' }, [plan, other])).toBe(true)
        expect(renamedInput(plan, { name: 'annuel', duration: '30' }, [plan, other])).toEqual({ error: 'nameTaken' })
    })

    it('is sent back whole, switched on', () => {
        expect(switchedOn({ ...plan, active: false })).toEqual({ ...quotasInput(plan, plan.quotas), active: true })
    })
})

describe('what students read about a plan', () => {
    const typed = () => ({
        ...emptyDetails(),
        fr: { label: ' Mensuel ', tagline: '', features: ' A \n\n B\n' },
        en: { label: 'Monthly', tagline: 'Fast', features: '' },
    })
    it('trims, drops empty fields and empty languages', () => {
        expect(detailsInput(typed())).toEqual({ details: { fr: { label: 'Mensuel', features: ['A', 'B'] }, en: { label: 'Monthly', tagline: 'Fast' } } })
        expect(detailsInput(emptyDetails())).toEqual({ details: {} })
    })
    it('refuses what payments-api refuses, naming the language', () => {
        const long = (n: number) => 'x'.repeat(n)
        expect(detailsInput({ ...typed(), ar: { label: long(41), tagline: '', features: '' } })).toEqual({ error: 'detailLabelLong', locale: 'ar' })
        expect(detailsInput({ ...typed(), en: { label: '', tagline: long(121), features: '' } })).toEqual({ error: 'detailTaglineLong', locale: 'en' })
        expect(detailsInput({ ...typed(), en: { label: '', tagline: '', features: Array(11).fill('a').join('\n') } })).toEqual({
            error: 'detailFeaturesMany',
            locale: 'en',
        })
        expect(detailsInput({ ...typed(), fr: { label: '', tagline: '', features: long(141) } })).toEqual({ error: 'detailFeatureLong', locale: 'fr' })
        expect(detailsInput({ ...typed(), fr: { label: long(40), tagline: long(120), features: long(140) } })).toHaveProperty('details')
    })
    it('fills the form from the plan and gives the same details back', () => {
        const details = { fr: { label: 'Mensuel', features: ['A', 'B'] }, ar: { tagline: 'س' } }
        expect(detailsInput(detailsTyped(details))).toEqual({ details })
    })
    it('is never sent by the other saves of a plan, which would wipe it', () => {
        const described = { ...plan, details: { fr: { label: 'M' } } }
        const others = [quotasInput(described, {}), switchedOn(described), renamedInput(described, { name: 'X', duration: '30' }, [])]
        for (const o of others) expect('input' in o ? o.input : o).not.toHaveProperty('details')
        const built = planInput(described, { price: '35', regular: '', until: '' })
        expect('input' in built && built.input).not.toHaveProperty('details')
    })
})
