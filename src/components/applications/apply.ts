import type { Application, LetterLanguage, Tone } from '@/types/application'

const DAY = 86_400_000

// paragraphs splits a letter on blank lines.
export const paragraphs = (body: string) =>
    body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)

// sentence tidies what the student typed and makes sure it ends like a sentence.
export function sentence(s: string): string {
    const t = s.trim().replace(/\s+/g, ' ')
    if (!t) return ''
    return /[.!?…؟]$/.test(t) ? t : t + '.'
}

// ownIndex is the paragraph the student's own sentence follows: the first real paragraph, after the greeting.
export function ownIndex(paras: string[]): number {
    const i = paras.findIndex((p) => p.length >= 80)
    return i === -1 ? Math.min(1, paras.length - 1) : i
}

// compose is the body that leaves: the paragraphs, with the student's sentence at the end of the first real one.
export function compose(paras: string[], own: string): string {
    const kept = paras.map((p) => p.trim()).filter(Boolean)
    const o = sentence(own)
    if (!o) return kept.join('\n\n')
    const i = ownIndex(kept)
    if (i < 0) return o
    return kept.map((p, k) => (k === i ? `${p} ${o}` : p)).join('\n\n')
}

// Slot is a suggested time to send: recruiters read more in the morning.
export type Slot = { key: 'next' | 'monday'; at: Date; tomorrow: boolean }

const morning = (d: Date, plus: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + plus, 8, 30)

// slots are the next working morning and the Monday after it, at 8:30.
export function slots(now = new Date()): Slot[] {
    let n = 1
    while ([0, 6].includes(morning(now, n).getDay())) n++
    let m = n + 1
    while (morning(now, m).getDay() !== 1) m++
    return [
        { key: 'next', at: morning(now, n), tomorrow: n === 1 },
        { key: 'monday', at: morning(now, m), tomorrow: false },
    ]
}

// localInput is a date as a datetime-local input wants it.
export function localInput(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// validTime says whether email-api takes this time: at least a few minutes ahead, at most a year.
export function validTime(at: Date | null, now = new Date()): at is Date {
    if (!at || Number.isNaN(at.getTime())) return false
    const ms = at.getTime() - now.getTime()
    return ms >= 5 * 60_000 && ms <= 365 * DAY
}

// ApplyError is what went wrong when sending, as the screen reacts to it.
export type ApplyError = 'gmail' | 'plan' | 'already' | 'closed' | 'noEmail' | 'other'

export function applyError(status: number | undefined, message = ''): ApplyError {
    if (status === 402) return 'plan'
    if (status === 422) return 'noEmail'
    if (status === 409) {
        if (/gmail/i.test(message)) return 'gmail'
        if (/closed/i.test(message)) return 'closed'
        return 'already'
    }
    return 'other'
}

export const FOLLOW_UP_DAYS = 14

// sentAt is when the application left: when Gmail sent it, or when the student said they sent it.
export const sentAt = (a: Pick<Application, 'email' | 'created_at'>) => new Date(a.email?.sent_at ?? a.created_at)

// live says the student has an application to this offer that is waiting to leave, sent or answered.
export const live = (a: Pick<Application, 'status'>) => ['scheduled', 'sent', 'opened', 'replied'].includes(a.status)

export function followUpDue(a: Pick<Application, 'status' | 'email' | 'created_at'>, now = new Date()): boolean {
    return (a.status === 'sent' || a.status === 'opened') && now.getTime() - sentAt(a).getTime() >= FOLLOW_UP_DAYS * DAY
}

// followUpOn is the day the student is reminded to follow up.
export const followUpOn = (a: Pick<Application, 'email' | 'created_at'>) => new Date(sentAt(a).getTime() + FOLLOW_UP_DAYS * DAY)

// Bucket is the section of « Mes candidatures » an application sits in.
export type Bucket = 'todo' | 'waiting' | 'done'

export function bucket(a: Pick<Application, 'status' | 'email' | 'created_at'>, now = new Date()): Bucket {
    if (a.status === 'failed' || followUpDue(a, now)) return 'todo'
    if (a.status === 'scheduled' || a.status === 'sent' || a.status === 'opened') return 'waiting'
    return 'done'
}

// left says an application really went out (a scheduled one cancelled before its time did not).
const left = (a: Pick<Application, 'status' | 'email' | 'via'>) =>
    a.status !== 'scheduled' && a.status !== 'failed' && (a.via === 'self' || a.email?.status === 'sent')

export function sentThisMonth(items: Application[], now = new Date()): number {
    return items.filter((a) => {
        const d = sentAt(a)
        return left(a) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
}

// Pending is the letter kept while the browser goes to Google to connect Gmail and comes back.
export type Pending = { jobId: string; subject: string; paras: string[]; own: string; tone: Tone; language: LetterLanguage; later: boolean; at: string }

const KEY = '9itchi:apply'

export function savePending(p: Pending) {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(p))
    } catch {
        // Private mode: the letter is simply written again on the way back.
    }
}

function read(): Pending | null {
    try {
        const p = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Pending | null
        return p && typeof p.jobId === 'string' && Array.isArray(p.paras) ? p : null
    } catch {
        return null
    }
}

// pendingJob is the offer the student was applying to when they left for Google, if any.
export const pendingJob = () => read()?.jobId ?? null

// takePending returns the kept letter of this offer and forgets it.
export function takePending(jobId: string): Pending | null {
    const p = read()
    if (!p || p.jobId !== jobId) return null
    try {
        sessionStorage.removeItem(KEY)
    } catch {
        // nothing to forget
    }
    return p
}
