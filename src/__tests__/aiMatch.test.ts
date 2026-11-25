import { describe, expect, it } from 'vitest'
import { left, matchError } from '@/components/jobs/aiMatch'

describe('matchError', () => {
    it('tells a plan without analyses from a monthly limit reached', () => {
        expect(matchError(402, 'the AI analysis of offers is part of the subscription')).toBe('plan')
        expect(matchError(402, 'monthly limit of AI analyses of your plan reached')).toBe('used')
    })
    it('names an empty CV, a busy AI, and anything else', () => {
        expect(matchError(422)).toBe('emptyCv')
        expect(matchError(502)).toBe('busy')
        expect(matchError(503)).toBe('busy')
        expect(matchError(500)).toBe('failed')
        expect(matchError(undefined)).toBe('failed')
    })
})

describe('left', () => {
    it('is what the plan still allows this month, never below zero', () => {
        expect(left(5, 2)).toBe(3)
        expect(left(5, 7)).toBe(0)
        expect(left(null, 9)).toBeNull()
    })
})
