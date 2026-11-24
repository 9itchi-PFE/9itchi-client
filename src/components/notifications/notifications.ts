import type { Notification } from '@/types/notification'

// Shown is how one notification is written on the page: which sentence, with which names, and where its button leads.
export type TitleKey = 'openedBy' | 'opened' | 'sentTo' | 'sent' | 'failedTo' | 'failed' | 'matches' | 'raw'
export type ActionKey = 'follow' | 'see' | 'seeOffers'
export type Glyph = { kind: 'company'; company: string } | { kind: 'count'; count: number } | { kind: 'alert' } | { kind: 'bell' }

export type Shown = {
    title: TitleKey
    values: { company: string; count: number }
    // raw is the title as notification-api wrote it, for the types the page has no sentence for.
    raw: string
    detail: string
    action: ActionKey | null
    href: string
    glyph: Glyph
    // urgent is something that needs the student: its button is the dark one while it is unread.
    urgent: boolean
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)

// describe turns a notification into what the page shows. The names come from `data`; without them the sentence is
// said without the name.
export function describe(n: Pick<Notification, 'type' | 'title' | 'data'>): Shown {
    const d = n.data ?? {}
    const company = text(d.company)
    const base = { values: { company, count: 0 }, raw: n.title, detail: text(d.job_title), href: '/applications', urgent: false }
    const glyph: Glyph = company ? { kind: 'company', company } : { kind: 'bell' }
    switch (n.type) {
        case 'email_opened':
            return { ...base, title: company ? 'openedBy' : 'opened', action: 'follow', glyph }
        case 'scheduled_email_sent':
            return { ...base, title: company ? 'sentTo' : 'sent', action: 'see', glyph }
        case 'email_failed':
            return { ...base, title: company ? 'failedTo' : 'failed', action: 'see', glyph: { kind: 'alert' }, urgent: true }
        case 'new_matching_jobs': {
            const c = count(d.count)
            return {
                ...base,
                values: { company: '', count: c },
                title: c ? 'matches' : 'raw',
                detail: '',
                action: 'seeOffers',
                href: '/jobs',
                glyph: c ? { kind: 'count', count: c } : { kind: 'bell' },
            }
        }
        default:
            return { ...base, title: 'raw', detail: text(d.body) || text(d.message), action: null, href: '', glyph: { kind: 'bell' } }
    }
}

// When says how the date of a notification is written: the time for today, « Hier », else the day.
export type When = { kind: 'today' | 'yesterday' | 'date'; at: Date }

export function when(iso: string, now = new Date()): When {
    const at = new Date(iso)
    const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const days = Math.round((day(now) - day(at)) / 86_400_000)
    return { kind: days <= 0 ? 'today' : days === 1 ? 'yesterday' : 'date', at }
}

// split keeps the order of the list and separates what is new from what was read.
export function split<T extends { read: boolean }>(items: T[]): { fresh: T[]; earlier: T[] } {
    return { fresh: items.filter((n) => !n.read), earlier: items.filter((n) => n.read) }
}
