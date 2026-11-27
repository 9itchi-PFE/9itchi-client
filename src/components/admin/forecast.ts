import type { ProspectDay } from '@/types/prospects'
import type { Integration } from '@/types/statistics'

const DAY = 86_400_000

export type Balance = NonNullable<Integration['balance']>

// Forecast projects a provider's credits to its renewal date from the live balance (every use of the key, JobAutopilot
// included). Times are UTC milliseconds; runsOut is when the projection reaches 0 (null when it lasts the cycle).
export type Forecast = {
    start: number
    end: number
    now: number
    limit: number
    left: number
    perDay: number
    projected: number
    runsOut: number | null
    daysEarly: number
}

// cycleStart is resets_on minus one calendar month (UTC), kept inside the shorter month (31 March -> 28/29 February).
export function cycleStart(end: Date): Date {
    const y = end.getUTCFullYear()
    const m = end.getUTCMonth() - 1
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    return new Date(Date.UTC(y, m, Math.min(end.getUTCDate(), last)))
}

// forecast is null without a renewal date or a limit. elapsed counts at least one day, so a cycle that just started
// does not blow the burn rate up; a balance above its limit counts as nothing used.
export function forecast(balance: Balance, now: Date = new Date()): Forecast | null {
    if (!balance.resets_on || balance.limit <= 0) return null
    const endDate = new Date(`${balance.resets_on}T00:00:00Z`)
    if (Number.isNaN(endDate.getTime())) return null
    const end = endDate.getTime()
    const start = cycleStart(endDate).getTime()
    const at = Math.min(Math.max(now.getTime(), start), end)
    const limit = balance.limit
    const left = Math.min(Math.max(balance.left, 0), limit)
    const elapsed = Math.max(1, (at - start) / DAY)
    const perDay = (limit - left) / elapsed
    const daysLeft = (end - at) / DAY
    const projected = left - perDay * daysLeft
    if (projected >= 0) return { start, end, now: at, limit, left, perDay, projected, runsOut: null, daysEarly: 0 }
    const runsOut = at + (left / perDay) * DAY
    return { start, end, now: at, limit, left, perDay, projected, runsOut, daysEarly: Math.floor((end - runsOut) / DAY) }
}

// ownSpend adds the credits 9itchi spent on a provider since the cycle start. Only 31 days are known: partial says the
// cycle started before them, so the sum covers the last 30 days only.
export function ownSpend(daily: ProspectDay[], provider: string, start: number): { credits: number; partial: boolean } {
    const from = new Date(start).toISOString().slice(0, 10)
    const credits = daily.filter((d) => d.day >= from).reduce((n, d) => n + (d.credits?.[provider] ?? 0), 0)
    return { credits, partial: daily.length > 0 && from < daily[0].day }
}
