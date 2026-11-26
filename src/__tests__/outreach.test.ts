import { describe, expect, it } from 'vitest'
import { domainOf, fromTunisInput, initials, linkSource, scheduleOk, tunisInput } from '@/components/outreach/outreach'

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
