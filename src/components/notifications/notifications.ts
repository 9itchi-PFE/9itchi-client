import type { Notification } from '@/types/notification'

// Shown is how one notification is written on the page: which sentence, with which names, and where its button leads.
export type TitleKey = 'openedBy' | 'opened' | 'sentTo' | 'sent' | 'failedTo' | 'failed' | 'matches' | 'closingAt' | 'closing' | 'tips' | 'raw'
export type ActionKey = 'follow' | 'see' | 'seeOffers' | 'seeOffer' | 'checkCv'
export type Glyph = { kind: 'company'; company: string } | { kind: 'count'; count: number } | { kind: 'alert' } | { kind: 'bell' }

export type Shown = {
    title: TitleKey
    // day is the day an offer closes, at noon UTC so that it is the same day wherever it is written.
    values: { company: string; count: number; day?: Date }
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
// id keeps what can be put in a path of the app as it is.
const id = (v: unknown) => (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : '')
const day = (v: unknown) => {
    const m = typeof v === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null
    const at = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)) : null
    return at && !Number.isNaN(at.getTime()) ? at : null
}

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
        case 'saved_job_closing': {
            const at = day(d.closes_on)
            const job = id(d.job_id)
            if (!at) return { ...base, title: 'raw', action: job ? 'seeOffer' : 'seeOffers', href: job ? `/jobs/${job}` : '/jobs', glyph }
            return {
                ...base,
                values: { company, count: 0, day: at },
                title: company ? 'closingAt' : 'closing',
                action: job ? 'seeOffer' : 'seeOffers',
                href: job ? `/jobs/${job}` : '/jobs',
                glyph,
            }
        }
        case 'cv_tip': {
            const c = count(d.count)
            const cv = id(d.resume_id)
            return {
                ...base,
                values: { company: '', count: c },
                title: c ? 'tips' : 'raw',
                detail: '',
                action: 'checkCv',
                href: cv ? `/resumes/${cv}/check` : '/resumes',
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
