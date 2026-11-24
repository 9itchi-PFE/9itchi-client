import { createTranslator } from 'next-intl'
import fr from '../../messages/fr.json'
import en from '../../messages/en.json'
import ar from '../../messages/ar.json'
import { describe as suite, expect, it } from 'vitest'
import { describe, split, when } from '@/components/notifications/notifications'

const n = (type: string, data: Record<string, unknown> | null = {}, title = 'Server title') => ({ type, data, title })

suite('describe', () => {
    it('names the company when the offer is known', () => {
        const s = describe(n('email_opened', { company: 'Novapay', job_title: 'Synchronisation hors ligne' }))
        expect(s.title).toBe('openedBy')
        expect(s.values.company).toBe('Novapay')
        expect(s.detail).toBe('Synchronisation hors ligne')
        expect(s.glyph).toEqual({ kind: 'company', company: 'Novapay' })
        expect(s.href).toBe('/applications')
        expect(s.action).toBe('follow')
        expect(s.urgent).toBe(false)
    })

    it('says it without the name when the offer is not known', () => {
        for (const data of [{}, null, { company: '   ' }, { company: 42 }]) {
            const s = describe(n('email_opened', data as Record<string, unknown> | null))
            expect(s.title).toBe('opened')
            expect(s.glyph).toEqual({ kind: 'bell' })
        }
        expect(describe(n('scheduled_email_sent')).title).toBe('sent')
        expect(describe(n('scheduled_email_sent', { company: 'Telnet' })).title).toBe('sentTo')
    })

    it('makes an application that did not leave the urgent one', () => {
        const s = describe(n('email_failed', { company: 'Telnet' }))
        expect(s.title).toBe('failedTo')
        expect(s.urgent).toBe(true)
        expect(s.glyph).toEqual({ kind: 'alert' })
        expect(describe(n('email_failed')).title).toBe('failed')
    })

    it('counts the new offers and leads to them', () => {
        const s = describe(n('new_matching_jobs', { count: 3 }))
        expect(s.title).toBe('matches')
        expect(s.values.count).toBe(3)
        expect(s.href).toBe('/jobs')
        expect(s.glyph).toEqual({ kind: 'count', count: 3 })
        // Without a usable count the title of the server is shown as it is.
        for (const count of [0, -2, 'three', undefined]) expect(describe(n('new_matching_jobs', { count })).title).toBe('raw')
    })

    it('says when a saved offer closes and leads to it', () => {
        const job = '3f2b8c1e-5d47-4a9b-8e21-7c6d5b4a3f10'
        const s = describe(n('saved_job_closing', { job_id: job, job_title: 'Portail RH', company: 'Acme', closes_on: '2026-12-03', days_left: 2 }))
        expect(s.title).toBe('closingAt')
        expect(s.values.day?.toISOString()).toBe('2026-12-03T12:00:00.000Z')
        expect(s.detail).toBe('Portail RH')
        expect(s.action).toBe('seeOffer')
        expect(s.href).toBe(`/jobs/${job}`)
        expect(s.glyph).toEqual({ kind: 'company', company: 'Acme' })
        expect(describe(n('saved_job_closing', { job_id: job, closes_on: '2026-12-03' })).title).toBe('closing')
        // Without a day the server's title is shown; without a usable id the button leads to the offers.
        expect(describe(n('saved_job_closing', { job_id: job, closes_on: 'soon' })).title).toBe('raw')
        const lost = describe(n('saved_job_closing', { job_id: '../admin', closes_on: '2026-12-03' }))
        expect(lost.href).toBe('/jobs')
        expect(lost.action).toBe('seeOffers')
    })

    it('counts what is left to correct on the CV and leads to its check', () => {
        const cv = '9a1c7e55-2b3d-4f60-a1b2-c3d4e5f60718'
        const s = describe(n('cv_tip', { resume_id: cv, count: 4, rule: 'summary' }))
        expect(s.title).toBe('tips')
        expect(s.values.count).toBe(4)
        expect(s.action).toBe('checkCv')
        expect(s.href).toBe(`/resumes/${cv}/check`)
        expect(s.glyph).toEqual({ kind: 'count', count: 4 })
        expect(describe(n('cv_tip', { count: 4 })).href).toBe('/resumes')
        expect(describe(n('cv_tip', { resume_id: cv })).title).toBe('raw')
    })

    it('shows a type it has no sentence for as the server wrote it, without a button', () => {
        const s = describe(n('admin_message', { body: 'Maintenance ce soir.' }, 'Message de l’équipe'))
        expect(s.title).toBe('raw')
        expect(s.raw).toBe('Message de l’équipe')
        expect(s.detail).toBe('Maintenance ce soir.')
        expect(s.action).toBeNull()
        expect(describe(n('something_new', { message: 'Bonjour' })).detail).toBe('Bonjour')
    })
})

suite('when', () => {
    const now = new Date(2026, 10, 24, 15, 0)
    it('gives the time for today, « yesterday », then the day', () => {
        expect(when(new Date(2026, 10, 24, 0, 5).toISOString(), now).kind).toBe('today')
        expect(when(new Date(2026, 10, 23, 23, 55).toISOString(), now).kind).toBe('yesterday')
        expect(when(new Date(2026, 10, 22, 12, 0).toISOString(), now).kind).toBe('date')
        expect(when(new Date(2026, 10, 20, 9, 0).toISOString(), now).kind).toBe('date')
    })
    it('never calls a notification dated a little ahead « tomorrow »', () => {
        expect(when(new Date(2026, 10, 25, 0, 1).toISOString(), now).kind).toBe('today')
    })
})

suite('split', () => {
    it('separates the new from the read and keeps the order', () => {
        const items = [
            { id: 'a', read: false },
            { id: 'b', read: true },
            { id: 'c', read: false },
            { id: 'd', read: true },
        ]
        const { fresh, earlier } = split(items)
        expect(fresh.map((x) => x.id)).toEqual(['a', 'c'])
        expect(earlier.map((x) => x.id)).toEqual(['b', 'd'])
    })
})

suite('sentences', () => {
    const say = (locale: string, messages: typeof fr) => createTranslator({ locale, messages, namespace: 'notifications', timeZone: 'Africa/Tunis' })

    it('write the day an offer closes and the points of a CV in each language', () => {
        const s = describe(n('saved_job_closing', { company: 'Acme', closes_on: '2026-12-03' }))
        expect(say('fr', fr)(s.title as 'closingAt', s.values)).toBe('L’offre de Acme ferme le 3 décembre.')
        expect(say('en', en)(s.title as 'closingAt', s.values)).toBe('The offer from Acme closes on December 3.')
        expect(say('ar', ar)(s.title as 'closingAt', s.values)).toContain('Acme')
        expect(say('fr', fr)('closing', s.values)).toBe('Une offre que tu as enregistrée ferme le 3 décembre.')
        expect(say('fr', fr)('tips', { count: 1 })).toBe('1 point à corriger sur ton CV.')
        expect(say('fr', fr)('tips', { count: 4 })).toBe('4 points à corriger sur ton CV.')
        expect(say('en', en)('tips', { count: 4 })).toBe('4 points to correct on your CV.')
        expect(say('ar', ar)('tips', { count: 2 })).toBe('نقطتان للتصحيح في سيرتك الذاتية.')
    })
})
