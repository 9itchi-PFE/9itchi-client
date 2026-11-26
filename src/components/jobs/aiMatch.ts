import type { JobMatch, MatchLevel } from '@/types/application'

// matchError says why the AI could not read the CV against the offer, from the status email-api answered.
export function matchError(status: number | undefined, detail = ''): 'plan' | 'used' | 'emptyCv' | 'busy' | 'failed' {
    if (status === 402) return /limit/i.test(detail) ? 'used' : 'plan'
    if (status === 422) return 'emptyCv'
    if (status === 502 || status === 503 || status === 504) return 'busy'
    return 'failed'
}

// levelTone colours the score: the stronger the fit, the stronger the mark.
export const levelTone: Record<MatchLevel, string> = {
    strong: 'bg-lime text-ink',
    good: 'bg-ok-bg text-ok-fg',
    partial: 'bg-[#FFF4E5] text-[#9A5B00]',
    weak: 'bg-fill text-ink-2',
}

// left is how many analyses the plan still allows this month; null when it sets no limit.
export const left = (limit: number | null, used: number) => (limit == null ? null : Math.max(limit - used, 0))

// keywordBlock is what the keywords block shows; null (block hidden) when the analysis has none, as the ones made
// before keywords existed.
export function keywordBlock(m: Pick<JobMatch, 'keywords' | 'keyword_coverage'>) {
    const matched = m.keywords?.matched ?? []
    const missing = m.keywords?.missing ?? []
    if (!matched.length && !missing.length) return null
    const total = matched.length + missing.length
    const coverage = Math.min(Math.max(Math.round(m.keyword_coverage ?? (matched.length / total) * 100), 0), 100)
    return { matched, missing, total, coverage }
}
