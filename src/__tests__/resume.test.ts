import { describe, expect, it } from 'vitest'
import { checkLine } from '@/components/resume/editor/bulletChecks'
import { itemOfPath, sectionOfPath, sectionsToFix } from '@/components/resume/editor/sections'
import { splitLanguage, shortLink } from '@/components/resume/cvText'
import { fileBase } from '@/components/resume/editor/fileBase'
import { normalize } from '@/types/resume'

describe('checkLine', () => {
    it('reads a good French line', () => {
        expect(checkLine('Corrigé 15 anomalies remontées par les utilisateurs.', 'fr')).toEqual({ past: true, pronoun: false, short: true, number: true })
    })
    it('flags a line without a past verb, with « je » or too long', () => {
        expect(checkLine('Fonctionne sans réseau', 'fr').past).toBe(false)
        expect(checkLine('Développé avec mon équipe', 'fr').pronoun).toBe(true)
        expect(checkLine('Conçu ' + 'x'.repeat(160), 'fr').short).toBe(false)
    })
    it('reads English lines', () => {
        expect(checkLine('Built a booking page used 300 times', 'en').past).toBe(true)
        expect(checkLine('I built my app', 'en').pronoun).toBe(true)
    })
})

describe('rule paths', () => {
    it('map to editor sections and items', () => {
        expect(sectionOfPath('experience[1].description[2]')).toBe('experience')
        expect(sectionOfPath('contact.phone')).toBe('contact')
        expect(sectionOfPath('skill_groups[0]')).toBe('skills')
        expect(sectionOfPath('extra[2].items[0]')).toBe('extra:2')
        expect(sectionOfPath('layout')).toBeNull()
        expect(itemOfPath('projects[3].description[1]')).toEqual({ item: 3, line: 1 })
        const s = sectionsToFix([
            { id: 'a', group: 'contact', status: 'fix', where: 'contact.phone' },
            { id: 'b', group: 'experience', status: 'ok', where: 'experience[0]' },
        ])
        expect([...s]).toEqual(['contact'])
    })
})

describe('cv text', () => {
    it('splits language levels and shortens links', () => {
        expect(splitLanguage('Arabe: Langue maternelle')).toEqual(['Arabe', 'Langue maternelle'])
        expect(splitLanguage('Anglais — B2')).toEqual(['Anglais', 'B2'])
        expect(shortLink('https://www.github.com/x/')).toBe('github.com/x')
    })
    it('names the file like resume-api', () => {
        expect(fileBase(' Inès  Ben Mansour ', 'CV')).toBe('ines_ben_mansour')
        expect(fileBase('محمد', 'Mon CV')).toBe('Mon CV')
    })
    it('normalizes missing lists', () => {
        const c = normalize({ contact: { name: 'x' } as never })
        expect(c.projects).toEqual([])
        expect(c.contact.links).toEqual([])
    })
})
