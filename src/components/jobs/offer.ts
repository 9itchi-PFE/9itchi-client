import type { JobSummary } from '@/types/job'

// Soft tints of the company badges, as in the canvas.
const TINTS = ['#E9F7B0', '#DCE8FF', '#E4DEFF', '#DDF3E6', '#FFE9DC', '#F2F3F5']
// Book covers of the PFE books band.
export const COVERS = ['#D6F25E', '#DCE8FF', '#E4DEFF', '#DDF3E6', '#FFE9DC']

// initials gives two letters for a company badge: « Novapay Systems » → NP, « Medina » → ME.
export function initials(company: string): string {
    const words = company
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean)
    if (!words.length) return '?'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}

// tint picks the same colour for the same company every time.
export function tint(company: string): string {
    let h = 0
    for (const c of company.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return TINTS[h % TINTS.length]
}

export type Match = { fits: string[]; others: string[]; strong: boolean }

// match splits an offer's skills into those on the CV and the others (case-insensitive).
// strong (« Fait pour toi ») means the CV covers at least half of them. Null when the offer lists no skills.
export function match(skills: string[], cv: string[]): Match | null {
    if (!skills.length) return null
    const mine = new Set(cv.map((s) => s.trim().toLowerCase()))
    const fits = skills.filter((s) => mine.has(s.trim().toLowerCase()))
    const others = skills.filter((s) => !mine.has(s.trim().toLowerCase()))
    return { fits, others, strong: fits.length / skills.length >= 0.5 }
}

const DAY = 24 * 60 * 60 * 1000

// daysLeft counts whole days from today to a YYYY-MM-DD closing date (0 = closes today, negative = closed).
export function daysLeft(closesOn: string, now = new Date()): number {
    const [y, m, d] = closesOn.split('-').map(Number)
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((Date.UTC(y, m - 1, d) - today) / DAY)
}

export type Deadline = { kind: 'soon'; days: number } | { kind: 'on'; date: Date } | { kind: 'closed'; date: Date }

// deadline is how a closing date reads: within a week « Ferme dans 3 jours » (urgent), later « Ferme le 15 déc. ».
export function deadline(closesOn: string | null, now = new Date()): Deadline | null {
    if (!closesOn) return null
    const n = daysLeft(closesOn, now)
    const [y, m, d] = closesOn.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (n < 0) return { kind: 'closed', date }
    if (n <= 7) return { kind: 'soon', days: n }
    return { kind: 'on', date }
}

// fresh offers (« Nouveau ») were posted in the last two days.
export const fresh = (postedAt: string, now = new Date()) => now.getTime() - new Date(postedAt).getTime() < 2 * DAY

const SOURCES: Record<string, string> = {
    tanitjobs: 'Tanitjobs',
    linkedin: 'LinkedIn',
    keejob: 'Keejob',
    optioncarriere: 'Optioncarrière',
    emploitunisie: 'Emploi Tunisie',
    farojob: 'Farojob',
}

// sourceName is the site an offer was found on, as students know it.
export function sourceName(source: string): string {
    const key = source.toLowerCase().replace(/[^a-z]/g, '')
    if (SOURCES[key]) return SOURCES[key]
    return source ? source[0].toUpperCase() + source.slice(1) : source
}

// fromBook tells offers published in a PFE book.
export const fromBook = (j: Pick<JobSummary, 'book_id'>) => !!j.book_id

// city is the place line of a card: the location, or « À distance » for remote offers with none.
export const city = (j: Pick<JobSummary, 'location' | 'work_mode'>, remote: string) => j.location || (j.work_mode === 'remote' ? remote : '')
