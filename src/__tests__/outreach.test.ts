import { describe, expect, it } from 'vitest'
import {
    addKeyword,
    buildSearch,
    companyInitial,
    countryName,
    domainOf,
    faviconUrl,
    fromTunisInput,
    initials,
    linkSource,
    scheduleOk,
    searchStep,
    tunisInput,
    whyOf,
} from '@/components/outreach/outreach'

describe('linkSource', () => {
    it('knows a 9itchi offer, LinkedIn and other sites', () => {
        expect(linkSource('https://9itchi-pfe.com/offres/0e2e0000-0000-4000-8000-0000000000a1')).toBe('9itchi')
        expect(linkSource('https://www.9itchi-pfe.com/offres/abc/')).toBe('9itchi')
        expect(linkSource('http://localhost:3000/offres/abc', 'localhost')).toBe('9itchi')
        expect(linkSource('https://www.linkedin.com/jobs/view/123')).toBe('linkedin')
        expect(linkSource('https://tn.linkedin.com/jobs/view/123')).toBe('linkedin')
        expect(linkSource('https://lnkd.in/abc')).toBe('linkedin')
        expect(linkSource('https://careers.exemple.tn/offre/42')).toBe('other')
        // 9itchi pages that are not an offer are read like any site.
        expect(linkSource('https://9itchi-pfe.com/jobs')).toBe('other')
    })
    it('waits for a web link', () => {
        expect(linkSource('')).toBeNull()
        expect(linkSource('linkedin')).toBeNull()
        expect(linkSource('https://exemple')).toBeNull()
        expect(linkSource('ftp://exemple.tn/offre')).toBeNull()
        expect(linkSource('javascript:alert(1)')).toBeNull()
    })
})

describe('Tunis time', () => {
    it('reads and writes datetime-local values at UTC+1', () => {
        expect(tunisInput(new Date('2026-12-01T07:30:00Z'))).toBe('2026-12-01T08:30')
        expect(fromTunisInput('2026-12-01T08:30')?.toISOString()).toBe('2026-12-01T07:30:00.000Z')
        // Same offset in summer: Tunis has no summer time.
        expect(fromTunisInput('2027-07-01T08:30')?.toISOString()).toBe('2027-07-01T07:30:00.000Z')
        expect(fromTunisInput('')).toBeNull()
    })
    it('takes a time from a minute ahead to a year ahead', () => {
        const now = new Date('2026-12-01T10:00:00Z')
        expect(scheduleOk(new Date('2026-12-01T10:00:30Z'), now)).toBe(false)
        expect(scheduleOk(new Date('2026-12-01T10:05:00Z'), now)).toBe(true)
        expect(scheduleOk(new Date('2027-12-02T10:00:00Z'), now)).toBe(false)
        expect(scheduleOk(null, now)).toBe(false)
    })
})

describe('helpers', () => {
    it('makes initials and domains', () => {
        expect(initials('Amira Ben Salah')).toBe('AS')
        expect(initials('karim')).toBe('K')
        expect(initials(' ')).toBe('?')
        expect(domainOf('https://www.Exemple.tn/careers')).toBe('exemple.tn')
        expect(domainOf('exemple.tn')).toBe('exemple.tn')
        expect(domainOf('')).toBe('')
    })
})

describe('radar search', () => {
    const form = { resumeId: 'r1', goal: '  PFE data  ', contract: 'pfe' as const, keywords: ['React'], country: 'tn', contacts: 5 }

    it('builds the body email-api expects', () => {
        expect(buildSearch(form)).toEqual({ resume_id: 'r1', goal: 'PFE data', contract: 'pfe', keywords: ['React'], country: 'TN', contacts: 5 })
    })

    it('needs a CV and keeps within the limits', () => {
        expect(buildSearch({ ...form, resumeId: '' })).toBeNull()
        const b = buildSearch({ ...form, goal: 'x'.repeat(400), contacts: 42, country: 'France', contract: 'freelance' as never })!
        expect(b.goal).toHaveLength(300)
        expect(b.contacts).toBe(10)
        expect(b.country).toBe('TN')
        expect(b.contract).toBe('')
        expect(buildSearch({ ...form, contacts: 0 })!.contacts).toBe(1)
        expect(buildSearch({ ...form, contacts: NaN })!.contacts).toBe(5)
        const many = Array.from({ length: 12 }, (_, i) => `k${i}`)
        expect(buildSearch({ ...form, keywords: [...many, 'k1'] })!.keywords).toHaveLength(10)
    })

    it('adds keywords once, trimmed and cut', () => {
        expect(addKeyword(['React'], ' react ')).toEqual(['React'])
        expect(addKeyword([], '   ')).toEqual([])
        expect(addKeyword([], '  machine   learning ')).toEqual(['machine learning'])
        expect(addKeyword([], 'a'.repeat(60))[0]).toHaveLength(40)
        const full = Array.from({ length: 10 }, (_, i) => `k${i}`)
        expect(addKeyword(full, 'more')).toBe(full)
    })

    it('shows the progress steps by time, the last one until the answer', () => {
        expect(searchStep(0)).toBe(0)
        expect(searchStep(3_000)).toBe(1)
        expect(searchStep(15_000)).toBe(2)
        expect(searchStep(28_000)).toBe(3)
        expect(searchStep(120_000)).toBe(3)
    })

    it('names countries in the page language', () => {
        expect(countryName('TN', 'fr')).toBe('Tunisie')
        expect(countryName('FR', 'en')).toBe('France')
        expect(countryName('??', 'fr')).toBe('??')
    })
})

describe('radar cards', () => {
    it('uses the favicon of the domain, else the initial', () => {
        expect(faviconUrl('www.Exemple.tn')).toBe('https://www.google.com/s2/favicons?domain=exemple.tn&sz=64')
        expect(faviconUrl('')).toBeNull()
        expect(faviconUrl('localhost')).toBeNull()
        expect(companyInitial('entreprise Alpha', 'Amira')).toBe('E')
        expect(companyInitial('', 'amira')).toBe('A')
        expect(companyInitial(' ')).toBe('?')
    })

    it('reads why a company was picked, old rows included', () => {
        expect(whyOf({ matched_keywords: ['react', '', 'data'] })).toEqual(['react', 'data'])
        expect(whyOf({ matched_keywords: null })).toEqual([])
        expect(whyOf({})).toEqual([])
    })
})
