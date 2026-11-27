// Helpers of Recruiter Radar and « Email from a link », kept pure for the tests.
import type { Recruiter, RecruiterSearchInput } from '@/types/recruiter'

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

// CONTRACTS are the contract chips of the radar's search, as email-api names them.
export const CONTRACTS = ['pfe', 'stage', 'alternance', 'cdi', 'cdd'] as const
export type Contract = (typeof CONTRACTS)[number]

// COUNTRIES the radar searches in (ISO 3166 alpha-2), Tunisia first and by default.
export const COUNTRIES = ['TN', 'FR', 'MA', 'DZ', 'BE', 'CA', 'DE', 'CH', 'LU', 'IT', 'ES', 'GB', 'NL', 'QA', 'AE', 'SA'] as const

export const GOAL_MAX = 300
export const KEYWORDS_MAX = 10
export const KEYWORD_MAX = 40
export const CONTACTS_MAX = 10
export const CONTACTS_DEFAULT = 5

// countryName is the country's name in the page's language (the code when the browser cannot name it).
export function countryName(code: string, locale: string): string {
    try {
        return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
    } catch {
        return code
    }
}

// addKeyword adds a typed keyword (trimmed, cut to 40 characters) unless it is empty, already there, or the list is full.
export function addKeyword(list: string[], typed: string): string[] {
    const w = typed.trim().replace(/\s+/g, ' ').slice(0, KEYWORD_MAX).trim()
    if (!w || list.length >= KEYWORDS_MAX || list.some((k) => k.toLowerCase() === w.toLowerCase())) return list
    return [...list, w]
}

export type SearchForm = { resumeId: string; goal: string; contract: Contract | ''; keywords: string[]; country: string; contacts: number }

// buildSearch is the body of POST /recruiters/search from the form, within email-api's limits; null without a CV.
export function buildSearch(f: SearchForm): RecruiterSearchInput | null {
    if (!f.resumeId) return null
    const keywords = f.keywords.reduce<string[]>(addKeyword, [])
    const country = /^[A-Za-z]{2}$/.test(f.country.trim()) ? f.country.trim().toUpperCase() : 'TN'
    const n = Math.round(Number(f.contacts))
    return {
        resume_id: f.resumeId,
        goal: f.goal.trim().slice(0, GOAL_MAX),
        contract: (CONTRACTS as readonly string[]).includes(f.contract) ? f.contract : '',
        keywords,
        country,
        contacts: Number.isFinite(n) ? Math.min(CONTACTS_MAX, Math.max(1, n)) : CONTACTS_DEFAULT,
    }
}

// SEARCH_STEPS are the progress steps shown while email-api searches (up to 45 s): each one starts at its time in
// ms, the last one stays until the answer.
export const SEARCH_STEPS = [
    { key: 'resume', at: 0 },
    { key: 'companies', at: 3_000 },
    { key: 'people', at: 12_000 },
    { key: 'ranking', at: 28_000 },
] as const

// searchStep is the index of the step shown after elapsed ms.
export function searchStep(elapsed: number): number {
    let i = 0
    SEARCH_STEPS.forEach((s, n) => {
        if (elapsed >= s.at) i = n
    })
    return i
}

// domainOf keeps the host of a company domain written with or without https:// (no www).
export function domainOf(typed: string): string {
    const s = typed.trim().toLowerCase()
    if (!s) return ''
    try {
        return new URL(s.includes('://') ? s : `https://${s}`).hostname.replace(/^www\./, '')
    } catch {
        return s
    }
}

// faviconUrl is the company's icon from Google's favicon service; null when there is no usable domain.
export function faviconUrl(domain: string): string | null {
    const host = domainOf(domain)
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
}

// companyInitial is the letter shown instead of a favicon (company first, then the person).
export function companyInitial(company: string, name = ''): string {
    const c = (company.trim() || name.trim())[0]
    return c ? c.toUpperCase() : '?'
}

// whyOf is the matched keywords of a prospect (old rows have none).
export const whyOf = (r: Pick<Recruiter, 'matched_keywords'>) => (r.matched_keywords ?? []).filter(Boolean)

// emailOk is a light check of an address typed by the student (email-api checks it again).
export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
