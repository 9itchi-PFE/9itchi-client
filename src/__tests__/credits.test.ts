import { describe, expect, it } from 'vitest'
import { groupTotal, levelOf, parseQuota } from '@/components/admin/credits'
import type { Integration } from '@/types/statistics'

const item = (over: Partial<Integration>): Integration => ({
    provider: 'gemini',
    label: 'Gemini',
    kind: 'ai',
    unit: 'tokens',
    quota: 0,
    used: 0,
    remaining: 0,
    percent: 0,
    has_token: false,
    token_hint: '',
    ...over,
})

describe('levelOf', () => {
    it('warns from 70 % and turns urgent from 90 %', () => {
        expect([0, 69, 70, 89, 90, 140].map(levelOf)).toEqual(['ok', 'ok', 'warn', 'warn', 'high', 'high'])
    })
})

describe('groupTotal', () => {
    it('adds up only the providers of the kind that have a quota', () => {
        const items = [
            item({ provider: 'gemini', quota: 1000, used: 250 }),
            item({ provider: 'openai', quota: 3000, used: 750 }),
            item({ provider: 'x', quota: 0, used: 999 }),
            item({ provider: 'llamaindex', kind: 'plugin', quota: 100, used: 90 }),
        ]
        expect(groupTotal(items, 'ai')).toEqual({ used: 1000, quota: 4000, percent: 25 })
        expect(groupTotal(items, 'plugin')).toEqual({ used: 90, quota: 100, percent: 90 })
    })
    it('has no percent without any quota', () => {
        expect(groupTotal([item({ used: 5 })], 'ai').percent).toBeNull()
    })
})

describe('parseQuota', () => {
    it('reads a whole number, tolerating spaces and commas, and an empty field', () => {
        expect(parseQuota('1 500,000')).toBe(1500000)
        expect(parseQuota(' ')).toBe('')
        expect(parseQuota('12.5')).toBeNull()
        expect(parseQuota('-3')).toBeNull()
        expect(parseQuota('abc')).toBeNull()
    })
})
