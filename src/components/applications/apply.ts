import type { Allowance, Application, LetterLanguage, Tone } from '@/types/application'

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
export function compose(paras: string[], own: string, sig: string[] = []): string {
    const kept = paras.map((p) => p.trim()).filter(Boolean)
    const o = sentence(own)
    const i = ownIndex(kept)
    const text = !o ? kept.join('\n\n') : i < 0 ? o : kept.map((p, k) => (k === i ? `${p} ${o}` : p)).join('\n\n')
    // The signature goes right under the last line of the letter (the name), one line each.
    return sig.length ? `${text}\n${sig.join('\n')}` : text
}

export type SignatureSource = { speciality?: string; year?: string; school?: string; phone?: string; linkedin?: string; github?: string }

// signature is what goes under every letter, from « Mon profil » (as the design draws it): « speciality, year »,
// « school · phone », then the LinkedIn and GitHub pages without https://www. Empty parts are left out; the
// name is not repeated, the letter already ends with it. yearLabel turns a year code into words.
export function signature(p: SignatureSource | undefined, yearLabel: (code: string) => string): string[] {
    if (!p) return []
    const clean = (v?: string) => (v ?? '').trim()
    const school = clean(p.school) === 'OTHER' ? '' : clean(p.school)
    const link = (v?: string) =>
        clean(v)
            .replace(/^https?:\/\/(www\.)?/i, '')
            .replace(/\/$/, '')
    return [
        [clean(p.speciality), clean(p.year) ? yearLabel(clean(p.year)) : ''].filter(Boolean).join(', '),
        [school, clean(p.phone)].filter(Boolean).join(' · '),
        link(p.linkedin),
        link(p.github),
    ].filter(Boolean)
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
export type ApplyError = 'gmail' | 'plan' | 'already' | 'closed' | 'noEmail' | 'noFile' | 'other'

export function applyError(status: number | undefined, message = ''): ApplyError {
    if (status === 402) return 'plan'
    // 422 is also a CV with no imported file, when the application would leave with it (no subscription).
    if (status === 422) return /imported file/i.test(message) ? 'noFile' : 'noEmail'
    if (status === 409) {
        if (/gmail/i.test(message)) return 'gmail'
        if (/closed/i.test(message)) return 'closed'
        return 'already'
    }
    return 'other'
}

// Sending is how the next application leaves: with the CV built in 9itchi ('built'), with the imported file
// because the student has no subscription ('original', and how many of those are left), or not at all ('blocked').
// Until the allowance is known the screen behaves as before and lets email-api decide.
export type Sending = { kind: 'built' } | { kind: 'original'; left: number; limit: number } | { kind: 'blocked'; limit: number }

export function sending(a: Allowance | undefined): Sending {
    if (!a) return { kind: 'built' }
    if (a.mode === 'none') return { kind: 'blocked', limit: 0 }
    const left = a.limit === null ? Infinity : Math.max(0, a.limit - a.used)
    if (a.mode === 'original') return left > 0 ? { kind: 'original', left, limit: a.limit ?? left } : { kind: 'blocked', limit: a.limit ?? 0 }
    return left > 0 ? { kind: 'built' } : { kind: 'blocked', limit: 0 }
}

// FOLLOW_UP_DAYS is how long an application waits for an answer before its follow-up is proposed (email-api agrees).
export const FOLLOW_UP_DAYS = 7

// sentAt is when the application left: when Gmail sent it, or when the student said they sent it.
export const sentAt = (a: Pick<Application, 'email' | 'created_at'>) => new Date(a.email?.sent_at ?? a.created_at)

// live says the student has an application to this offer that is waiting to leave, sent or answered.
export const live = (a: Pick<Application, 'status'>) => ['scheduled', 'sent', 'opened', 'replied'].includes(a.status)

// followUpDue: no answer a week after it left, and no follow-up sent yet (one per application).
export function followUpDue(a: Pick<Application, 'status' | 'email' | 'created_at' | 'follow_up_sent_at'>, now = new Date()): boolean {
    return (a.status === 'sent' || a.status === 'opened') && !a.follow_up_sent_at && now.getTime() - sentAt(a).getTime() >= FOLLOW_UP_DAYS * DAY
}

// followUpOn is the day the student is reminded to follow up.
export const followUpOn = (a: Pick<Application, 'email' | 'created_at'>) => new Date(sentAt(a).getTime() + FOLLOW_UP_DAYS * DAY)

// Bucket is the section of « Mes candidatures » an application sits in.
export type Bucket = 'todo' | 'waiting' | 'done'

export function bucket(a: Pick<Application, 'status' | 'email' | 'created_at' | 'follow_up_sent_at'>, now = new Date()): Bucket {
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
export type Pending = {
    jobId: string
    subject: string
    paras: string[]
    own: string
    tone: Tone
    language: LetterLanguage
    later: boolean
    at: string
    // The CV chosen and, for an offer without an application address, the recruiter's address typed.
    cv?: string
    to?: string
}

// EMAIL is a plain check of a recruiter's address before sending; email-api checks it again.
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const validEmail = (v: string) => v.length <= 254 && EMAIL.test(v.trim())

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

// Overview is the summary at the top of « Mes candidatures ». Opens can only be seen for what left from Gmail, so the
// open rate is over those; the reply rate is over everything that left.
export type Overview = { sent: number; fromGmail: number; opened: number; replied: number; followUps: number }

const answered = ['replied', 'closed']

export function overview(items: Application[], opens: Record<string, string>, now = new Date()): Overview {
    const gone = items.filter(
        (a) => a.status !== 'scheduled' && a.status !== 'failed' && !(a.status === 'withdrawn' && a.via === 'gmail' && a.email?.status !== 'sent'),
    )
    const gmail = gone.filter((a) => a.via === 'gmail' && a.email?.status === 'sent')
    return {
        sent: gone.length,
        fromGmail: gmail.length,
        opened: gmail.filter((a) => a.status === 'opened' || answered.includes(a.status) || (a.email && opens[a.email.id])).length,
        replied: gone.filter((a) => answered.includes(a.status)).length,
        followUps: items.filter((a) => followUpDue(a, now)).length,
    }
}

// rate is a share as a whole percent, null when there is nothing to divide.
export const rate = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null)
