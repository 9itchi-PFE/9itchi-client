import { describe, expect, it } from 'vitest'
import { resolveLook, lookCss } from '@/lib/cvLook'
import { emptyContent, sectionOrder } from '@/types/resume'

describe('sectionOrder', () => {
    it('defaults, then honours the chosen order and drops unknown or repeated keys', () => {
        const c = { ...emptyContent(), extra: [{ title: 'Clubs', items: ['x'] }] }
        expect(sectionOrder(c)[0]).toBe('summary')
        const o = sectionOrder({ ...c, section_order: ['skills', 'bogus', 'skills', 'extra:0'] })
        expect(o.slice(0, 2)).toEqual(['skills', 'extra:0'])
        expect(new Set(o).size).toBe(o.length)
        expect(o).toContain('education')
    })
})

describe('resolveLook', () => {
    it('keeps template defaults when no style is set', () => {
        const l = resolveLook('classic')
        expect([l.base, l.name, l.head, l.mx]).toEqual([10.5, 23, 13, 14])
        expect(lookCss(l)).not.toContain('color:')
    })
    it('applies deltas relative to the base size and accent targets', () => {
        const l = resolveLook('modern', { base_size: 9, name_delta: 9.5, accent: '#aa3300', accent_on: ['dates'], color_mode: 'multi', background: '#fafafa' })
        expect(l.name).toBe(18.5)
        expect(l.bg).toBe('#fafafa')
        expect(l.accents('dates')).toBe(true)
        expect(l.accents('headings')).toBe(false)
    })
    it('ignores invalid colors', () => {
        expect(resolveLook('classic', { accent: 'red' }).accent).toBeUndefined()
    })
})
