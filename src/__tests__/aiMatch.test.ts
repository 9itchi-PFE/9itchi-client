import { describe, expect, it } from 'vitest'
import { keywordBlock, left, matchError } from '@/components/jobs/aiMatch'

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

describe('keywordBlock', () => {
    it('is hidden when the analysis has no keywords, as the old ones', () => {
        expect(keywordBlock({})).toBeNull()
        expect(keywordBlock({ keywords: { matched: [], missing: [] }, keyword_coverage: 0 })).toBeNull()
    })
    it('keeps the offer order and counts the coverage', () => {
        const b = keywordBlock({ keywords: { matched: ['React', 'SQL'], missing: ['Go'] }, keyword_coverage: 67 })
        expect(b).toEqual({ matched: ['React', 'SQL'], missing: ['Go'], total: 3, coverage: 67 })
    })
    it('computes the coverage when the service gives none, and keeps it within 0-100', () => {
        expect(keywordBlock({ keywords: { matched: ['A'], missing: ['B'] } })?.coverage).toBe(50)
        expect(keywordBlock({ keywords: { matched: ['A'], missing: [] }, keyword_coverage: 250 })?.coverage).toBe(100)
    })
})
