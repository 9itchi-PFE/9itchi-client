import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, pages, refund, studentId, studentsQuery } from '@/components/admin/students'

describe('studentsQuery', () => {
    it('asks for students only, with the search trimmed and the filters that are set', () => {
        expect(studentsQuery('  ines ', 'suspended', 2)).toEqual({ role: 'candidate', q: 'ines', status: 'suspended', page: 2, page_size: PAGE_SIZE })
        expect(studentsQuery('', '', 1)).toEqual({ role: 'candidate', page: 1, page_size: PAGE_SIZE })
    })
    it('never asks below page 1 and keeps the search within what account-api accepts', () => {
        expect(studentsQuery('', '', 0).page).toBe(1)
        expect(studentsQuery('', '', Number.NaN).page).toBe(1)
        expect(studentsQuery('x'.repeat(300), '', 1).q).toHaveLength(100)
    })
})

describe('pages', () => {
    it('counts the pages of a list', () => {
        expect(pages(0)).toBe(1)
        expect(pages(PAGE_SIZE)).toBe(1)
        expect(pages(PAGE_SIZE + 1)).toBe(2)
        expect(pages(101, 50)).toBe(3)
    })
})

describe('studentId', () => {
    it('keeps an id only when it is one', () => {
        expect(studentId('A3A47F79-A90C-438A-AA18-422C5C828367')).toBe('a3a47f79-a90c-438a-aa18-422c5c828367')
        for (const bad of ['', 'me', '../plans', 42, undefined]) expect(studentId(bad)).toBe('')
    })
})

describe('refund', () => {
    const paid = { completed_at: '2026-11-20T10:00:00Z', amount_millimes: 35000 }
    const at = (iso: string) => new Date(iso)

    it('is open for 7 days when nothing was used since the payment', () => {
        expect(refund(paid, null, null, at('2026-11-25T08:00:00Z'))).toEqual({ state: 'open', until: at('2026-11-27T10:00:00Z') })
        // What was used before paying does not count.
        expect(refund(paid, '2026-11-19T09:00:00Z', '2026-11-20T09:59:59Z', at('2026-11-25T08:00:00Z'))?.state).toBe('open')
    })

    it('is closed once a CV was downloaded or an application left with the corrected CV', () => {
        const now = at('2026-11-25T08:00:00Z')
        expect(refund(paid, '2026-11-21T09:00:00Z', null, now)).toEqual({ state: 'used', by: 'download' })
        expect(refund(paid, null, '2026-11-20T10:00:00Z', now)).toEqual({ state: 'used', by: 'application' })
        expect(refund(paid, '2026-11-21T09:00:00Z', '2026-11-22T09:00:00Z', now)).toEqual({ state: 'used', by: 'both' })
        // One fact is enough, even when the other could not be read.
        expect(refund(paid, undefined, '2026-11-22T09:00:00Z', now)).toEqual({ state: 'used', by: 'application' })
    })

    it('claims nothing when what was used could not be read', () => {
        const now = at('2026-11-25T08:00:00Z')
        expect(refund(paid, undefined, null, now)).toEqual({ state: 'unknown' })
        expect(refund(paid, null, undefined, now)).toEqual({ state: 'unknown' })
    })

    it('does not apply after 7 days, to a payment of nothing, or to one that is not completed', () => {
        expect(refund(paid, null, null, at('2026-11-27T10:00:00Z'))).toBeNull()
        expect(refund({ ...paid, amount_millimes: 0 }, null, null, at('2026-11-21T10:00:00Z'))).toBeNull()
        expect(refund({ ...paid, completed_at: null }, null, null, at('2026-11-21T10:00:00Z'))).toBeNull()
        expect(refund({ ...paid, completed_at: 'nope' }, null, null, at('2026-11-21T10:00:00Z'))).toBeNull()
    })
})
