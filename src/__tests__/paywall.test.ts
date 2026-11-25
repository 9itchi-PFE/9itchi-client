import { describe, expect, it } from 'vitest'
import { seenFixes } from '@/components/resume/check/CvCheck'
import { downloadMode, downloadsLeft } from '@/components/resume/editor/DownloadDialogs'

describe('downloading a CV', () => {
    it('is never offered without a subscription', () => {
        expect(downloadMode(false, undefined)).toBe('pay')
        expect(downloadMode(false, { used: 0, limit: 5 })).toBe('pay')
    })
    it('follows the plan of a subscriber', () => {
        expect(downloadMode(true, undefined)).toBe('sub')
        expect(downloadMode(true, { used: 12, limit: null })).toBe('sub')
        expect(downloadMode(true, { used: 2, limit: 3 })).toBe('sub')
        expect(downloadMode(true, { used: 3, limit: 3 })).toBe('limit')
        expect(downloadMode(true, { used: 0, limit: 0 })).toBe('limit')
    })
    it('says how many are left in the period', () => {
        expect(downloadsLeft(undefined)).toBeNull()
        expect(downloadsLeft({ used: 4, limit: null })).toBeNull()
        expect(downloadsLeft({ used: 2, limit: 5 })).toBe(3)
        expect(downloadsLeft({ used: 7, limit: 5 })).toBe(0)
    })
})

describe('the diagnosis a plan shows', () => {
    it('counts the points to correct that are shown, not the locked ones', () => {
        expect(seenFixes([{ status: 'fix' }, { status: 'ok' }, { status: 'locked' }, { status: 'tip' }, { status: 'fix' }])).toBe(2)
        expect(seenFixes([])).toBe(0)
    })
})
