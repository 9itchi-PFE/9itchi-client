import type { JobSummary } from '@/types/job'
import type { WorkMode } from '@/types/preferences'
import { daysLeft } from './offer'

type Topic = Pick<JobSummary, 'starts_on' | 'closes_on' | 'duration_months' | 'stipend_tnd' | 'location' | 'work_mode'>

export type BookFacts = {
    start?: string
    length?: [number, number]
    pay?: [number, number] | 'unpaid'
    place?: string
    mode?: WorkMode
    deadline?: { date: string; days: number }
}

const mostCommon = <T>(xs: T[]): T | undefined => {
    const n = new Map<T, number>()
    let best: T | undefined
    for (const x of xs) {
        n.set(x, (n.get(x) ?? 0) + 1)
        if (best === undefined || n.get(x)! > n.get(best)!) best = x
    }
    return best
}

const range = (xs: number[]): [number, number] | undefined => (xs.length ? [Math.min(...xs), Math.max(...xs)] : undefined)

// bookFacts sums up a book's open topics for its header: earliest start, length and stipend ranges, usual place and mode,
// and the first closing date. A fact no topic gives is left out.
export function bookFacts(topics: Topic[], city: string | null, now = new Date()): BookFacts {
    const open = topics.filter((j) => !j.closes_on || daysLeft(j.closes_on, now) >= 0)
    const starts = open
        .map((j) => j.starts_on)
        .filter((s): s is string => !!s)
        .sort()
    const stipends = open.map((j) => j.stipend_tnd).filter((s): s is number => s != null)
    const paid = stipends.filter((s) => s > 0)
    const closes = open
        .map((j) => j.closes_on)
        .filter((s): s is string => !!s)
        .sort()
    return {
        start: starts[0],
        length: range(open.map((j) => j.duration_months).filter((m): m is number => !!m)),
        pay: paid.length ? range(paid) : stipends.length ? 'unpaid' : undefined,
        place: city || mostCommon(open.map((j) => j.location).filter(Boolean)),
        mode: mostCommon(open.map((j) => j.work_mode).filter((m): m is WorkMode => !!m)),
        deadline: closes[0] ? { date: closes[0], days: daysLeft(closes[0], now) } : undefined,
    }
}
