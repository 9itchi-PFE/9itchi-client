import { describe, expect, it } from 'vitest'
import {
    addKeyword,
    bookmarklet,
    buildSearch,
    companyInitial,
    countryName,
    domainOf,
    faviconUrl,
    fromTunisInput,
    initials,
    linkSource,
    offerFromHash,
    offerLink,
    logoSources,
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

    it('tries the logo, then the favicon, then nothing (initial)', () => {
        const icon = 'https://www.google.com/s2/favicons?domain=exemple.tn&sz=64'
        expect(logoSources({ logo_url: 'https://cdn.exemple.tn/logo.png', domain: 'exemple.tn' })).toEqual(['https://cdn.exemple.tn/logo.png', icon])
        expect(logoSources({ logo_url: '', domain: 'exemple.tn' })).toEqual([icon])
        expect(logoSources({ domain: 'exemple.tn' })).toEqual([icon])
        expect(logoSources({ logo_url: 'javascript:alert(1)', domain: 'exemple.tn' })).toEqual([icon])
        expect(logoSources({ logo_url: 'data:image/png;base64,AAAA', domain: '' })).toEqual([])
        expect(logoSources({ logo_url: 'http://exemple.tn/l.svg', domain: '' })).toEqual(['http://exemple.tn/l.svg'])
    })

    it('reads why a company was picked, old rows included', () => {
        expect(whyOf({ matched_keywords: ['react', '', 'data'] })).toEqual(['react', 'data'])
        expect(whyOf({ matched_keywords: null })).toEqual([])
        expect(whyOf({})).toEqual([])
    })
})

describe('offerLink and offerFromHash', () => {
    it('turns a LinkedIn search with a job open into the job page', () => {
        expect(offerLink(' https://www.linkedin.com/jobs/search/?currentJobId=4486555367&keywords=dev ')).toBe('https://www.linkedin.com/jobs/view/4486555367/')
        expect(offerLink('https://www.linkedin.com/jobs/collections/recommended/?currentJobId=12')).toBe('https://www.linkedin.com/jobs/view/12/')
        expect(offerLink('https://exemple.tn/jobs?currentJobId=12')).toBe('https://exemple.tn/jobs?currentJobId=12')
        expect(offerLink('pas un lien')).toBe('pas un lien')
    })
    it('reads the link and text the button sent', () => {
        const hash = '#u=' + encodeURIComponent('https://www.linkedin.com/jobs/search/?currentJobId=7') + '&t=' + encodeURIComponent(' Stage PFE & data ')
        expect(offerFromHash(hash)).toEqual({ url: 'https://www.linkedin.com/jobs/view/7/', text: 'Stage PFE & data' })
        expect(offerFromHash('')).toBeNull()
        expect(offerFromHash('#t=x')).toBeNull()
    })
    it('builds a bookmark that opens the link page with the page after #', () => {
        const js = bookmarklet('https://9itchi-pfe.com')
        expect(js.startsWith('javascript:')).toBe(true)
        const code = decodeURIComponent(js.slice('javascript:'.length))
        expect(code).toContain('"https://9itchi-pfe.com/outreach/link"')
        expect(code).toContain("'#u='+encodeURIComponent(location.href)")
        expect(() => new Function(code)).not.toThrow()
    })
})
