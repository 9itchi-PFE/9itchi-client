import { describe, expect, it } from 'vitest'
import { applyError, sending } from '@/components/applications/apply'
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

describe('how an application leaves', () => {
    it('lets email-api decide until the allowance is known', () => {
        expect(sending(undefined)).toEqual({ kind: 'built' })
    })
    it('sends the built CV within the plan', () => {
        expect(sending({ mode: 'plan', limit: null, used: 900 })).toEqual({ kind: 'built' })
        expect(sending({ mode: 'plan', limit: 500, used: 499 })).toEqual({ kind: 'built' })
        expect(sending({ mode: 'plan', limit: 500, used: 500 })).toEqual({ kind: 'blocked', limit: 0 })
    })
    it('sends the imported file a few times without a subscription', () => {
        expect(sending({ mode: 'original', limit: 5, used: 0 })).toEqual({ kind: 'original', left: 5, limit: 5 })
        expect(sending({ mode: 'original', limit: 5, used: 4 })).toEqual({ kind: 'original', left: 1, limit: 5 })
        expect(sending({ mode: 'original', limit: 5, used: 5 })).toEqual({ kind: 'blocked', limit: 5 })
        expect(sending({ mode: 'original', limit: 5, used: 7 })).toEqual({ kind: 'blocked', limit: 5 })
    })
    it('sends nothing when the plan sends nothing', () => {
        expect(sending({ mode: 'none', limit: null, used: 0 })).toEqual({ kind: 'blocked', limit: 0 })
    })
    it('tells a CV with no imported file from an offer with no email', () => {
        expect(applyError(422, 'this CV has no imported file to send')).toBe('noFile')
        expect(applyError(422, 'this offer does not take applications by email')).toBe('noEmail')
        expect(applyError(402, 'the applications without a subscription are used up')).toBe('plan')
    })
})
