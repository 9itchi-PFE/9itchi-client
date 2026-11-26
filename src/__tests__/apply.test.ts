import { describe, expect, it } from 'vitest'
import {
    applyError,
    bucket,
    compose,
    signature,
    followUpDue,
    followUpOn,
    live,
    localInput,
    ownIndex,
    paragraphs,
    sentence,
    sentThisMonth,
    slots,
    validTime,
    overview,
    rate,
} from '@/components/applications/apply'
import type { Application } from '@/types/application'

const long = 'Élève ingénieure en dernière année de génie logiciel, je recherche un stage de fin d’études de six mois.'

describe('letter', () => {
    it('splits on blank lines', () => {
        expect(paragraphs('Madame,\n\n  A\nB  \n\n\n\nC')).toEqual(['Madame,', 'A\nB', 'C'])
        expect(paragraphs('  ')).toEqual([])
    })
    it('ends the own sentence like a sentence', () => {
        expect(sentence('  j’utilise   vos terminaux ')).toBe('j’utilise vos terminaux.')
        expect(sentence('Pourquoi pas ?')).toBe('Pourquoi pas ?')
        expect(sentence(' ')).toBe('')
    })
    it('puts the own sentence after the first real paragraph', () => {
        const paras = ['Madame, Monsieur,', long, 'Cordialement,']
        expect(ownIndex(paras)).toBe(1)
        expect(compose(paras, 'Je connais vos produits')).toBe(`Madame, Monsieur,\n\n${long} Je connais vos produits.\n\nCordialement,`)
        expect(compose(paras, '')).toBe(paras.join('\n\n'))
        expect(compose(['Bonjour,', ' ', 'Court.'], 'Moi')).toBe('Bonjour,\n\nCourt. Moi.')
        expect(compose([], 'Moi')).toBe('Moi.')
        expect(ownIndex(['Seul'])).toBe(0)
    })
})

describe('schedule', () => {
    it('suggests the next working morning and the Monday after', () => {
        const tue = slots(new Date(2026, 10, 24, 15, 0)) // Tuesday
        expect(tue[0]).toMatchObject({ key: 'next', tomorrow: true })
        expect(localInput(tue[0].at)).toBe('2026-11-25T08:30')
        expect(localInput(tue[1].at)).toBe('2026-11-30T08:30')

        const fri = slots(new Date(2026, 10, 27, 15, 0)) // Friday: not Saturday morning
        expect(fri[0].tomorrow).toBe(false)
        expect(localInput(fri[0].at)).toBe('2026-11-30T08:30')
        expect(localInput(fri[1].at)).toBe('2026-12-07T08:30')
    })
    it('refuses a time too close, too far or unreadable', () => {
        const now = new Date(2026, 10, 24, 15, 0)
        expect(validTime(new Date(2026, 10, 24, 15, 2), now)).toBe(false)
        expect(validTime(new Date(2026, 10, 24, 16, 0), now)).toBe(true)
        expect(validTime(new Date(2028, 0, 1), now)).toBe(false)
        expect(validTime(new Date('x'), now)).toBe(false)
        expect(validTime(null, now)).toBe(false)
    })
})

describe('applyError', () => {
    it('reads what email-api refused', () => {
        expect(applyError(402)).toBe('plan')
        expect(applyError(422)).toBe('noEmail')
        expect(applyError(409, 'gmail is not connected')).toBe('gmail')
        expect(applyError(409, 'gmail access was revoked, reconnect gmail')).toBe('gmail')
        expect(applyError(409, 'this offer is closed')).toBe('closed')
        expect(applyError(409, 'you already applied to this offer')).toBe('already')
        expect(applyError(502)).toBe('other')
        expect(applyError(undefined)).toBe('other')
    })
})

const now = new Date(2026, 10, 24, 12, 0)
const app = (over: Partial<Application>): Application => ({
    id: 'a',
    job_id: 'j',
    email_id: null,
    status: 'sent',
    job_title: 'T',
    company: 'C',
    via: 'self',
    email: null,
    created_at: new Date(2026, 10, 20).toISOString(),
    updated_at: '',
    ...over,
})
const email = (status: 'sent' | 'scheduled' | 'cancelled' | 'failed', sent: Date | null) => ({
    id: 'e',
    recipient: 'r',
    subject: 's',
    status,
    scheduled_at: null,
    sent_at: sent ? sent.toISOString() : null,
})

describe('buckets', () => {
    it('asks to follow up a week without an answer, once', () => {
        const old = app({ created_at: new Date(2026, 10, 17).toISOString() })
        expect(followUpDue(old, now)).toBe(true)
        expect(bucket(old, now)).toBe('todo')
        expect(followUpDue(app({}), now)).toBe(false)
        expect(followUpDue(app({ status: 'replied', created_at: new Date(2026, 9, 1).toISOString() }), now)).toBe(false)
        expect(followUpOn(app({})).getDate()).toBe(27)
        expect(followUpDue({ ...old, follow_up_sent_at: new Date(2026, 10, 24).toISOString() }, now)).toBe(false)
    })
    it('counts from when Gmail sent it, not from when it was scheduled', () => {
        const a = app({ via: 'gmail', created_at: new Date(2026, 10, 1).toISOString(), email: email('sent', new Date(2026, 10, 20)) })
        expect(followUpDue(a, now)).toBe(false)
    })
    it('sorts the rest', () => {
        expect(bucket(app({ status: 'failed' }), now)).toBe('todo')
        expect(bucket(app({ status: 'scheduled' }), now)).toBe('waiting')
        expect(bucket(app({ status: 'opened' }), now)).toBe('waiting')
        expect(bucket(app({ status: 'replied' }), now)).toBe('done')
        expect(bucket(app({ status: 'closed' }), now)).toBe('done')
        expect(bucket(app({ status: 'withdrawn' }), now)).toBe('done')
        expect(live(app({ status: 'replied' }))).toBe(true)
        expect(live(app({ status: 'withdrawn' }))).toBe(false)
        expect(live(app({ status: 'failed' }))).toBe(false)
    })
    it('counts what really left this month', () => {
        const items = [
            app({}),
            app({ via: 'gmail', email: email('sent', new Date(2026, 10, 3)) }),
            app({ via: 'gmail', status: 'scheduled', email: email('scheduled', null) }),
            app({ via: 'gmail', status: 'withdrawn', email: email('cancelled', null) }),
            app({ via: 'gmail', status: 'failed', email: email('failed', null) }),
            app({ created_at: new Date(2026, 9, 30).toISOString() }),
            app({ status: 'replied' }),
        ]
        expect(sentThisMonth(items, now)).toBe(3)
    })
})

describe('the signature under the letters', () => {
    const year = (c: string) => ({ ing3: '3e année, cycle ingénieur' })[c] ?? c

    it('reads « Mon profil » as the design draws it, without the name', () => {
        expect(
            signature(
                {
                    speciality: 'Génie logiciel',
                    year: 'ing3',
                    school: 'ENIS',
                    phone: '+21620000000',
                    linkedin: 'https://www.linkedin.com/in/prenom-nom',
                    github: 'https://github.com/prenom-nom',
                },
                year,
            ),
        ).toEqual(['Génie logiciel, 3e année, cycle ingénieur', 'ENIS · +21620000000', 'linkedin.com/in/prenom-nom', 'github.com/prenom-nom'])
    })
    it('leaves out what is empty, and « Autre école »', () => {
        expect(signature({ school: 'OTHER', phone: '  ' }, year)).toEqual([])
        expect(signature({ year: 'ing3' }, year)).toEqual(['3e année, cycle ingénieur'])
        expect(signature(undefined, year)).toEqual([])
    })
    it('goes right under the last line of the letter', () => {
        expect(compose(['Bonjour,', 'Cordialement,\nPrénom Nom'], '', ['ENIS · +21620000000'])).toBe(
            'Bonjour,\n\nCordialement,\nPrénom Nom\nENIS · +21620000000',
        )
        expect(compose(['Bonjour,'], '', [])).toBe('Bonjour,')
    })
})

describe('overview', () => {
    it('counts what left, what was opened from Gmail, the answers and the follow-ups to send', () => {
        const items = [
            app({ id: 'g1', via: 'gmail', email: { ...email('sent', new Date(2026, 10, 20)), id: 'e1' } }),
            app({ id: 'g2', via: 'gmail', status: 'replied', email: { ...email('sent', new Date(2026, 10, 1)), id: 'e2' } }),
            app({ id: 'g3', via: 'gmail', email: { ...email('sent', new Date(2026, 10, 1)), id: 'e3' } }),
            app({ id: 's1', created_at: new Date(2026, 10, 10).toISOString() }),
            app({ id: 'x1', via: 'gmail', status: 'scheduled', email: email('scheduled', null) }),
            app({ id: 'x2', via: 'gmail', status: 'withdrawn', email: email('cancelled', null) }),
        ]
        expect(overview(items, { e1: '2026-11-21T10:00:00Z' }, now)).toEqual({ sent: 4, fromGmail: 3, opened: 2, replied: 1, followUps: 2 })
        expect(rate(1, 4)).toBe(25)
        expect(rate(0, 0)).toBeNull()
    })
})
