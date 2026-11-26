import type { Integration } from '@/types/statistics'

export type Level = 'ok' | 'warn' | 'high'

// levelOf colors a consumption: calm under 70 % of the quota, a warning from 70, urgent from 90.
export function levelOf(percent: number): Level {
    return percent >= 90 ? 'high' : percent >= 70 ? 'warn' : 'ok'
}

// groupTotal adds up the providers of one kind that have a quota (the others cannot be compared with it).
export function groupTotal(items: Integration[], kind: Integration['kind']): { used: number; quota: number; percent: number | null } {
    const set = items.filter((i) => i.kind === kind && i.quota > 0)
    const used = set.reduce((n, i) => n + i.used, 0)
    const quota = set.reduce((n, i) => n + i.quota, 0)
    return { used, quota, percent: quota > 0 ? Math.round((used / quota) * 100) : null }
}

// parseQuota reads the quota field: a whole number of 0 or more, '' when it was left empty (null = invalid).
export function parseQuota(raw: string): number | '' | null {
    const v = raw.replace(/[\s,]/g, '')
    if (v === '') return ''
    return /^\d{1,15}$/.test(v) ? Number(v) : null
}
