import { describe, expect, it } from 'vitest'
import { resolveLook, lookCss } from '@/lib/cvLook'
import { emptyContent, sectionOrder, visibleSections } from '@/types/resume'
describe('visibleSections', () => {
    it('drops hidden sections but keeps the order', () => {
        const c = { ...emptyContent(), hidden_sections: ['education', 'extra:9'] }
        expect(visibleSections(c)).not.toContain('education')
        expect(sectionOrder(c)).toContain('education')
    })
})
describe('body font', () => {
    it('applies the chosen family to the whole CV and ignores unknown ones', () => {
        expect(lookCss(resolveLook('classic', { body_font: 'lato' }))).toContain('font-family:"Lato"')
        expect(lookCss(resolveLook('classic', {}))).not.toContain('font-family')
        expect(resolveLook('classic', { body_font: 'x' as never }).bodyFont).toBe('sourcesans')
    })
})

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

import { visibleEntries as __ve } from '@/types/resume'
describe('visibleEntries', () => {
    it('drops hidden entries', () => {
        const c = { experience: [{ hidden: true }, {}], education: [], projects: [{ hidden: false }], certifications: [] } as never
        const v = __ve(c) as { experience: unknown[]; projects: unknown[] }
        expect(v.experience).toHaveLength(1)
        expect(v.projects).toHaveLength(1)
    })
})

describe('accent spots', () => {
    it('colors only the picked spot and keeps an empty pick empty', () => {
        const only = { accent: '#ff0000', accent_on: ['dates' as const] }
        const css = lookCss(resolveLook('classic', only), only)
        expect(css).toContain('[data-cv=date]{color:#ff0000;}')
        expect(css).toContain('[data-cv=loc]{color:inherit;}')
        const none = { accent: '#ff0000', accent_on: [] }
        expect(resolveLook('classic', none).accents('dates')).toBe(false)
    })
})