import { afterEach, describe, expect, it, vi } from 'vitest'
import { jobPosting, ldJson, plain } from '@/lib/publicJob'
import { siteUrl } from '@/lib/site'
import type { PublicJob } from '@/types/job'

const job: PublicJob = {
    id: '6f1d2c4e-8a0b-4c1d-9e2f-3a4b5c6d7e8f',
    title: 'Développeur Go',
    company: 'Atlas Logiciel',
    location: 'Sfax',
    contract_type: 'pfe',
    source: 'lever',
    description: '<p>Construire une API.</p>  Équipe de cinq.',
    stipend_tnd: 600,
    duration_months: 6,
    work_mode: 'hybrid',
    closes_on: '2027-02-28',
    starts_on: null,
    skills: ['Go'],
    pair_ok: false,
    easy_apply: true,
    topic: null,
    book_company: '',
    book_title: '',
    closed: false,
    posted_at: '2026-11-20T09:00:00Z',
}

describe('siteUrl', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('is read from NEXTAUTH_URL when the server runs, without a trailing slash', () => {
        vi.stubEnv('NEXTAUTH_URL', 'https://9itchi-pfe.com/')
        expect(siteUrl()).toBe('https://9itchi-pfe.com')
    })

    it('never points a production server to localhost', () => {
        vi.stubEnv('NEXTAUTH_URL', '')
        vi.stubEnv('NODE_ENV', 'production')
        expect(siteUrl()).toBe('https://9itchi-pfe.com')
    })

    it('stays on localhost in development', () => {
        vi.stubEnv('NEXTAUTH_URL', '')
        vi.stubEnv('NODE_ENV', 'development')
        expect(siteUrl()).toBe('http://localhost:3000')
    })
})

describe('jobPosting', () => {
    it('describes an open offer the way Google reads job postings', () => {
        const data = jobPosting(job, 'https://9itchi-pfe.com/offres/x') as Record<string, unknown>
        expect(data['@type']).toBe('JobPosting')
        expect(data.datePosted).toBe('2026-11-20')
        expect(data.validThrough).toBe('2027-02-28T23:59:59+01:00')
        expect(data.employmentType).toBe('INTERN')
        expect(data.hiringOrganization).toEqual({ '@type': 'Organization', name: 'Atlas Logiciel' })
        expect(data.jobLocation).toMatchObject({ address: { addressLocality: 'Sfax', addressCountry: 'TN' } })
        expect(data.baseSalary).toMatchObject({ currency: 'TND', value: { value: 600, unitText: 'MONTH' } })
        expect(data.jobLocationType).toBeUndefined()
    })

    it('marks a remote offer as telecommute, with no stipend when there is none', () => {
        const data = jobPosting({ ...job, work_mode: 'remote', location: '', stipend_tnd: null, closes_on: null }, 'u') as Record<string, unknown>
        expect(data.jobLocationType).toBe('TELECOMMUTE')
        expect(data.jobLocation).toBeUndefined()
        expect(data.baseSalary).toBeUndefined()
        expect(data.validThrough).toBeUndefined()
    })
})

describe('plain and ldJson', () => {
    it('turns an offer into one short line', () => {
        expect(plain(job.description)).toBe('Construire une API. Équipe de cinq.')
        const long = plain('mot '.repeat(80))
        expect(long.length).toBeLessThanOrEqual(155)
        expect(long.endsWith('…')).toBe(true)
    })

    it('cannot close the script tag it is written in', () => {
        expect(ldJson({ t: '</script><b>' })).not.toContain('</script>')
    })
})
