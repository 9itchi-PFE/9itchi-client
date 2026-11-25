import type { Dashboard, MetricPoint } from '@/types/statistics'

// Period is how far back the page looks. statistics-api serves 366 days at most.
export type Period = '7' | '30' | '365'

const iso = (d: Date) => d.toISOString().slice(0, 10)

// rangeOf is the days a period covers, today included (days are counted in UTC, as statistics-api stores them).
export function rangeOf(period: Period, now = new Date()): { from: string; to: string } {
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const from = new Date(to)
    from.setUTCDate(from.getUTCDate() - (Number(period) - 1))
    return { from: iso(from), to: iso(to) }
}

// total reads how much a metric adds up to over the period (0 when statistics-api does not know it).
export const total = (d: Dashboard | undefined, name: string) => d?.metrics?.[name]?.total ?? 0

// rate is a part of a whole in percent, rounded; null when there is nothing to compare with.
export function rate(part: number, whole: number): number | null {
    return whole > 0 ? Math.round((part / whole) * 100) : null
}

// share is the width of a bar, in percent of the longest one (at least 2 so that a small value stays visible).
export function share(value: number, max: number): number {
    return value > 0 && max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
}

// weekOf is the ISO week of a day (YYYY-MM-DD): its number, and the Monday it starts on.
export function weekOf(day: string): { week: number; monday: string } {
    const d = new Date(`${day}T00:00:00Z`)
    const weekday = (d.getUTCDay() + 6) % 7
    const monday = new Date(d)
    monday.setUTCDate(d.getUTCDate() - weekday)
    const thursday = new Date(monday)
    thursday.setUTCDate(monday.getUTCDate() + 3)
    const jan1 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
    return { week: Math.floor((thursday.getTime() - jan1.getTime()) / 604_800_000) + 1, monday: iso(monday) }
}

export type Week = { week: number; monday: string; values: number[] }

// weekly adds daily series up by ISO week and keeps the last `keep` weeks, oldest first. One value per series.
export function weekly(series: (MetricPoint[] | undefined)[], keep = 6): Week[] {
    const byMonday = new Map<string, Week>()
    series.forEach((points, i) => {
        for (const p of points ?? []) {
            const w = weekOf(p.day)
            const row = byMonday.get(w.monday) ?? { ...w, values: series.map(() => 0) }
            row.values[i] += p.value
            byMonday.set(w.monday, row)
        }
    })
    return [...byMonday.values()].sort((a, b) => a.monday.localeCompare(b.monday)).slice(-keep)
}

// before is the period of the same length that ends the day before a range starts: what a figure is compared with.
export function before(range: { from: string; to: string }): { from: string; to: string } {
    const from = new Date(`${range.from}T00:00:00Z`)
    const to = new Date(`${range.to}T00:00:00Z`)
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
    const end = new Date(from)
    end.setUTCDate(end.getUTCDate() - 1)
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - (days - 1))
    return { from: iso(start), to: iso(end) }
}
