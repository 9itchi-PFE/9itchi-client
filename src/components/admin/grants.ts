import { COUNTS, withCount } from './plans'

export const GRANTS_MAX = 500
export const GRANT_NOTE_MAX = 200

// emailsOf reads the emails the admin typed, separated by commas, spaces or new lines: lower case, each once.
export function emailsOf(text: string): string[] {
    const out: string[] = []
    for (const raw of text.split(/[\s,;]+/)) {
        const e = raw.trim().toLowerCase()
        if (e && !out.includes(e)) out.push(e)
    }
    return out
}

// grantQuotas builds the quotas of a grant from the fields typed: an empty field is not sent. null: a field is
// not a whole number from 0, or no field is filled.
export function grantQuotas(typed: Record<string, string>): Record<string, number> | null {
    let quotas: Record<string, number> = {}
    for (const key of COUNTS) {
        const next = withCount(quotas, key, typed[key] ?? '')
        if (!next) return null
        quotas = next
    }
    return Object.keys(quotas).length ? quotas : null
}

// grantTyped is a grant's quotas as the fields show them.
export const grantTyped = (quotas: Record<string, number>): Record<string, string> => Object.fromEntries(Object.entries(quotas).map(([k, v]) => [k, String(v)]))

// grantSummary lists a grant's quotas as « label: n », known keys first in their order.
export function grantSummary(quotas: Record<string, number>, label: (key: string) => string): string {
    const known = (COUNTS as readonly string[]).filter((k) => k in quotas)
    const others = Object.keys(quotas)
        .filter((k) => !known.includes(k))
        .sort()
    return [...known, ...others].map((k) => `${label(k)}: ${quotas[k]}`).join(' · ')
}
