import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, pages, studentId, studentsQuery } from '@/components/admin/students'

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
