import { describe, expect, it } from 'vitest'
import { checks, number, places, sourceLook, status, toEdit, when } from '@/components/admin/collect'
import { isActive } from '@/components/layouts/AdminLayout/AdminHeader'
import type { ReviewJob } from '@/types/job'

const now = new Date(2026, 10, 24, 15, 0)

describe('when', () => {
    it('says never, minutes, hours, yesterday or a date', () => {
        expect(when(null, now)).toEqual({ kind: 'never' })
        expect(when(new Date(2026, 10, 24, 14, 30).toISOString(), now)).toEqual({ kind: 'minutes', count: 30 })
        expect(when(new Date(2026, 10, 24, 13, 0).toISOString(), now)).toEqual({ kind: 'hours', count: 2 })
        expect(when(new Date(2026, 10, 23, 3, 0).toISOString(), now)).toEqual({ kind: 'yesterday', time: '03:00' })
        expect(when(new Date(2026, 10, 20, 3, 0).toISOString(), now).kind).toBe('date')
    })
})

describe('sourceLook', () => {
    it('puts running and error before the switch', () => {
        expect(sourceLook({ enabled: false, state: 'running' })).toBe('running')
        expect(sourceLook({ enabled: false, state: 'error' })).toBe('error')
        expect(sourceLook({ enabled: false, state: 'ok' })).toBe('off')
        expect(sourceLook({ enabled: true, state: 'ok' })).toBe('ok')
        expect(sourceLook({ enabled: true, state: 'idle' })).toBe('idle')
    })
})

describe('form helpers', () => {
    it('reads cities and numbers', () => {
        expect(places(' Tunis, ,Sfax ,')).toEqual(['Tunis', 'Sfax'])
        expect(number('')).toBeNull()
        expect(number('x')).toBeNull()
        expect(number('900')).toBe(900)
    })
})

describe('status', () => {
    it('shows a passed deadline unless the offer is hidden', () => {
        expect(status({ review_status: 'pending', closes_on: '2026-11-23' }, now)).toBe('expired')
        expect(status({ review_status: 'pending', closes_on: '2026-11-24' }, now)).toBe('pending')
        expect(status({ review_status: 'hidden', closes_on: '2026-01-01' }, now)).toBe('hidden')
        expect(status({ review_status: 'published', closes_on: null }, now)).toBe('published')
    })
})

const job = (over: Partial<ReviewJob> = {}) =>
    ({
        id: 'j1',
        title: 'Portail développeur',
        company: 'Acme',
        location: 'Tunis',
        description: 'x',
        stipend_tnd: 900,
        duration_months: 6,
        work_mode: 'hybrid',
        starts_on: '2027-02-01',
        closes_on: '2027-01-15T00:00:00Z',
        skills: ['Go'],
        pair_ok: true,
        topic: 'web',
        apply_email: null,
        checks: [
            { key: 'company_known', ok: true },
            { key: 'deadline_not_passed', ok: true },
            { key: 'subject_and_skills', ok: true },
            { key: 'start_date', ok: true },
        ],
        ...over,
    }) as ReviewJob

describe('checks', () => {
    it('lists the four lines of the canvas', () => {
        expect(checks(job()).map((c) => c.key)).toEqual(['checkCompany', 'checkDeadline', 'checkSubject', 'checkFilled'])
    })
    it('names the first thing missing', () => {
        const noStart = job({ checks: job().checks.map((c) => (c.key === 'start_date' ? { ...c, ok: false } : c)) })
        expect(checks(noStart)[3]).toEqual({ key: 'missingStart', ok: false })
        expect(checks(job({ stipend_tnd: null }))[3].key).toBe('missingPay')
        expect(checks(job({ location: '' }))[3].key).toBe('missingCity')
        expect(checks(job({ location: '', work_mode: 'remote' }))[3].key).toBe('checkFilled')
        expect(checks(job({ checks: [] })).every((c) => !c.ok)).toBe(true)
    })
})

describe('toEdit', () => {
    it('fills the form with plain values', () => {
        const e = toEdit(job({ work_mode: null, topic: null }))
        expect(e.closes_on).toBe('2027-01-15')
        expect(e.work_mode).toBe('')
        expect(e.topic).toBe('')
        expect(e.apply_email).toBe('')
    })
})

describe('admin nav', () => {
    it('keeps Accueil exact and Plans active on promo codes', () => {
        expect(isActive('/admin/jobs', { href: '/admin', exact: true })).toBe(false)
        expect(isActive('/admin', { href: '/admin', exact: true })).toBe(true)
        expect(isActive('/admin/promo-codes', { href: '/admin/plans', also: ['/admin/promo-codes'] })).toBe(true)
        expect(isActive('/admin/jobsx', { href: '/admin/jobs' })).toBe(false)
    })
})
