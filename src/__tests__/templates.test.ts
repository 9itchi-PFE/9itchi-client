import { describe, expect, it } from 'vitest'
import { SAMPLE_CV, canWithdraw, ordered } from '@/components/admin/templates'

describe('canWithdraw', () => {
    const classic = { id: 'a', active: true }
    const modern = { id: 'b', active: true }
    const compact = { id: 'c', active: false }

    it('lets a published template go while another stays published', () => {
        expect(canWithdraw(classic, [classic, modern, compact])).toBe(true)
    })

    it('keeps the last published template', () => {
        expect(canWithdraw(classic, [classic, compact])).toBe(false)
        expect(canWithdraw(classic, [classic])).toBe(false)
    })

    it('has nothing to withdraw on a template that is not published', () => {
        expect(canWithdraw(compact, [classic, modern, compact])).toBe(false)
    })
})

describe('SAMPLE_CV', () => {
    it('fills every part a template draws differently', () => {
        expect(SAMPLE_CV.contact.name).toBe('Prénom Nom')
        expect(SAMPLE_CV.education).toHaveLength(1)
        expect(SAMPLE_CV.experience[0].description.length).toBeGreaterThan(0)
        expect(SAMPLE_CV.skills.length).toBeGreaterThan(0)
    })
})

describe('ordered', () => {
    it('follows the students’ gallery: Classic, Modern, Compact', () => {
        const list = [
            { layout: 'compact', name: 'Compact' },
            { layout: 'classic', name: 'Classic' },
            { layout: 'modern', name: 'Modern' },
        ] as const
        expect(ordered([...list]).map((t) => t.layout)).toEqual(['classic', 'modern', 'compact'])
    })
})
