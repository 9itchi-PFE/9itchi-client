// Helpers of Recruiter Radar and « Email from a link », kept pure for the tests.

export type LinkSource = '9itchi' | 'linkedin' | 'other'

const OWN_HOSTS = ['9itchi-pfe.com', 'www.9itchi-pfe.com']

// linkSource says where an offer link points, as the chip under the field shows it; null: not a web link yet.
// appHost is the host the app runs on (a 9itchi offer shared from a local or preview build).
export function linkSource(raw: string, appHost?: string): LinkSource | null {
    let u: URL
    try {
        u = new URL(raw.trim())
    } catch {
        return null
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    const host = u.hostname.toLowerCase()
    if (!host.includes('.') && host !== 'localhost') return null
    if ((OWN_HOSTS.includes(host) || (appHost && host === appHost.toLowerCase())) && /^\/offres\/[^/]+\/?$/.test(u.pathname)) return '9itchi'
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com') || host === 'lnkd.in') return 'linkedin'
    return 'other'
}

// Tunis keeps UTC+1 all year (no summer time since 2009): a datetime-local value is read and written at +01:00,
// whatever the browser's own zone.
const TUNIS_MS = 60 * 60_000

// tunisInput is a date as a datetime-local input shows it in Tunis time.
export function tunisInput(d: Date): string {
    return new Date(d.getTime() + TUNIS_MS).toISOString().slice(0, 16)
}

// fromTunisInput reads a datetime-local value typed in Tunis time; null when it is not a date.
export function fromTunisInput(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
    const d = new Date(`${value}:00+01:00`)
    return Number.isNaN(d.getTime()) ? null : d
}

const DAY = 24 * 60 * 60_000

// scheduleOk says whether email-api takes this time: more than a minute ahead, at most a year.
export function scheduleOk(at: Date | null, now = new Date()): at is Date {
    if (!at) return false
    const ms = at.getTime() - now.getTime()
    return ms > 60_000 && ms <= 365 * DAY
}

// initials are the letters of the avatar of a recruiter (two at most).
export function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

// CONTRACTS are the chips of the goal and of the keywords (searched as typed).
export const CONTRACTS = ['Stage PFE', 'Alternance', 'CDI', 'CDD'] as const

// domainOf keeps the host of a company domain typed with or without https:// (email-api wants a host name).
export function domainOf(typed: string): string {
    const s = typed.trim().toLowerCase()
    if (!s) return ''
    try {
        return new URL(s.includes('://') ? s : `https://${s}`).hostname.replace(/^www\./, '')
    } catch {
        return s
    }
}

// emailOk is a light check of an address typed by the student (email-api checks it again).
export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
