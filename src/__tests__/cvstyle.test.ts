import { describe, expect, it } from 'vitest'
import { resolveLook, lookCss, entryArrangement, entryDefault, groupRoles, skillSep } from '@/lib/cvLook'
import { emptyContent, sectionOrder, visibleSections } from '@/types/resume'
describe('entryArrangement', () => {
    it('leaves each template alone while neither field is set', () => {
        expect(entryArrangement('classic', 'experience', undefined)).toBeNull()
        expect(entryArrangement('modern', 'education', { gap: 2 })).toBeNull()
    })
    it('uses the chosen value and falls back to the template for the one left unset', () => {
        expect(entryArrangement('classic', 'experience', { entry_layout: 'inline' })).toEqual({ inline: true, subtitleFirst: false })
        expect(entryArrangement('compact', 'experience', { entry_layout: 'stacked' })).toEqual({ inline: false, subtitleFirst: true })
        expect(entryArrangement('modern', 'education', { entry_order: 'title_first' })).toEqual({ inline: true, subtitleFirst: false })
        expect(entryArrangement('classic', 'education', { entry_layout: 'inline', entry_order: 'subtitle_first' })).toEqual({
            inline: true,
            subtitleFirst: true,
        })
    })
    it('mirrors what the templates print today', () => {
        expect(entryDefault('classic', 'experience')).toEqual({ inline: false, subtitleFirst: false })
        expect(entryDefault('modern', 'experience')).toEqual({ inline: true, subtitleFirst: false })
        expect(entryDefault('modern', 'education')).toEqual({ inline: true, subtitleFirst: true })
        expect(entryDefault('compact', 'experience')).toEqual({ inline: true, subtitleFirst: true })
    })
})
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

describe('education order', () => {
    it('overrides entry_order for studies only and counts as a choice', () => {
        expect(entryArrangement('classic', 'education', { education_order: 'subtitle_first' })).toEqual({ inline: false, subtitleFirst: true })
        expect(entryArrangement('classic', 'experience', { education_order: 'subtitle_first' })).toBeNull()
        const both = { entry_order: 'subtitle_first', education_order: 'title_first' } as const
        expect(entryArrangement('modern', 'education', both)).toEqual({ inline: true, subtitleFirst: false })
        expect(entryArrangement('modern', 'experience', both)).toEqual({ inline: true, subtitleFirst: true })
    })
})

describe('groupRoles', () => {
    const job = (company: string) => ({ company })
    it('keeps one job per run while the style does not ask for it', () => {
        expect(groupRoles([job('A'), job('A')])).toHaveLength(2)
    })
    it('groups consecutive jobs at the same company, trimmed and case-insensitive', () => {
        const runs = groupRoles([job('Acme '), job('acme'), job('Beta'), job('Acme'), job(''), job(' ')], true)
        expect(runs.map((r) => r.length)).toEqual([2, 1, 1, 1, 1])
    })
})

describe('skills separator', () => {
    it('uses the chosen separator, else the template one', () => {
        expect(skillSep(undefined, ', ')).toBe(', ')
        expect(skillSep({}, ' · ')).toBe(' · ')
        expect(skillSep({ skills_style: 'bullet' }, ', ')).toBe('  •  ')
        expect(skillSep({ skills_style: 'bar' }, ' · ')).toBe('  |  ')
        expect(skillSep({ skills_style: 'comma' }, ' · ')).toBe(', ')
    })
})

describe('heading rule and section gap', () => {
    it('adds nothing while unset', () => {
        const css = lookCss(resolveLook('classic'))
        expect(css).not.toContain('border-bottom')
        expect(css).not.toContain('row-gap')
    })
    it('draws the chosen rule and replaces the space above headings', () => {
        const st = { heading_rule: 'thick' as const, section_gap: 20 }
        const css = lookCss(resolveLook('compact', st), st)
        expect(css).toContain('border-bottom-width:2px')
        expect(css).toContain('row-gap:0;')
        expect(resolveLook('compact', st).sectionGap).toBe(12)
        expect(lookCss(resolveLook('classic'), { heading_rule: 'none' })).toContain('border-bottom-width:0;')
    })
})
describe('two-column templates', () => {
    it('have their own look and stack entries like Classic', () => {
        for (const l of ['sidebar', 'split', 'banner'] as const) {
            expect(resolveLook(l).upper).toBe(true)
            expect(resolveLook(l).headBold).toBe(true)
            expect(entryDefault(l, 'experience')).toEqual({ inline: false, subtitleFirst: false })
            expect(entryDefault(l, 'education')).toEqual({ inline: false, subtitleFirst: false })
        }
        expect(resolveLook('banner').name).toBe(24)
        expect(resolveLook('sidebar').mx).toBe(8)
        expect(resolveLook('split').mx).toBe(12)
    })
    it('show contact icons by default only in Sidebar', () => {
        expect(resolveLook('sidebar').icons).toBe(true)
        expect(resolveLook('split').icons).toBe(false)
        expect(resolveLook('banner', { separator: 'icon' }).icons).toBe(true)
    })
    it('keep filled areas in their own colors when an accent is chosen', () => {
        const st = { accent: '#AA0000' }
        expect(lookCss(resolveLook('sidebar', st), st)).toContain('[data-fill] :is([data-cv=name]')
        expect(lookCss(resolveLook('sidebar', {}), {})).not.toContain('[data-fill]')
    })
})
