import { describe, expect, it } from 'vitest'
import { resumeSlots, uploadFailure } from '@/utils/resumeSlots'

describe('resumeSlots', () => {
    it('counts the CVs against the plan limit', () => {
        expect(resumeSlots(2, { resumes: 3 }, false)).toEqual({ used: 2, limit: 3, full: false, isFree: false })
        expect(resumeSlots(3, { resumes: 3 }, false).full).toBe(true)
        expect(resumeSlots(1, { resumes: 1 }, true)).toMatchObject({ full: true, isFree: true })
    })
    it('is unlimited when the plan has no resumes quota', () => {
        expect(resumeSlots(40, {}, false)).toEqual({ used: 40, limit: null, full: false, isFree: false })
        expect(resumeSlots(0, undefined, false).full).toBe(false)
    })
})

describe('uploadFailure', () => {
    it('sends a 402 to the subscription: free plan or limit reached', () => {
        expect(uploadFailure(402, true)).toBe('quota')
        expect(uploadFailure(402, false)).toBe('full')
    })
    it('maps the other answers', () => {
        expect(uploadFailure(413, false)).toBe('size')
        expect(uploadFailure(400, false)).toBe('type')
        expect(uploadFailure(500, false)).toBe('other')
        expect(uploadFailure(undefined, true)).toBe('other')
    })
})
