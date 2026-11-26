import { describe, expect, it } from 'vitest'
import { countLabel, premiumPlan, titleWithCount } from '@/lib/badges'

const plan = { id: 'p1', name: 'pfe', price: 35 } as never
const sub = { id: 's1', status: 'active' } as never

describe('countLabel', () => {
    it('writes the number up to 9 and 9+ above', () => {
        expect(countLabel(1)).toBe('1')
        expect(countLabel(9)).toBe('9')
        expect(countLabel(10)).toBe('9+')
        expect(countLabel(250)).toBe('9+')
    })
})

describe('titleWithCount', () => {
    it('prefixes the count and replaces an earlier prefix', () => {
        expect(titleWithCount('9itchi', 3)).toBe('(3) 9itchi')
        expect(titleWithCount('(3) 9itchi', 4)).toBe('(4) 9itchi')
    })
    it('takes the prefix off at 0', () => {
        expect(titleWithCount('(3) 9itchi', 0)).toBe('9itchi')
        expect(titleWithCount('9itchi', 0)).toBe('9itchi')
    })
})

describe('premiumPlan', () => {
    it('gives the plan of an active paid subscription', () => {
        expect(premiumPlan({ subscription: sub, is_free: false, plan })).toBe(plan)
    })
    it('gives nothing on the free view', () => {
        expect(premiumPlan(undefined)).toBeNull()
        expect(premiumPlan({ subscription: null, is_free: true, plan })).toBeNull()
        expect(premiumPlan({ subscription: sub, is_free: true, plan })).toBeNull()
        expect(premiumPlan({ subscription: { id: 's1', status: 'canceled' } as never, is_free: false, plan })).toBeNull()
    })
})
