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
