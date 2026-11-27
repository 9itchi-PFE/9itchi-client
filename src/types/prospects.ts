// email-api GET /admin/prospects/stats: the shared contact pool built by Recruiter Radar, how often a search is
// served from it (no Hunter/Apollo credit spent), and the credits 9itchi spent per provider each UTC day.
export type ProspectSource = 'website' | 'hunter' | 'apollo' | 'offer' | 'import'

export type ProspectPool = {
    companies: number
    contacts: number
    verified: number
    hr: number
    // Usable by the pipeline: not opted out, verified or updated within 180 days.
    fresh: number
    by_source: Record<ProspectSource, number>
}

// Rates are whole percents (0-100) over the fresh searches of the last 30 days.
export type ProspectWindow = {
    searches: number
    contacts_shown: number
    contacts_from_pool: number
    pool_hit_rate: number
    pool_only_searches: number
    pool_only_rate: number
}

// One UTC day; credits has every provider that spends credits (hunter, apollo), 0 when none.
export type ProspectDay = { day: string; searches: number; contacts_from_pool: number; contacts_found: number; credits: Record<string, number> }

// daily is 31 days, oldest first, ending today (UTC).
export type ProspectStats = { pool: ProspectPool; last_30_days: ProspectWindow; daily: ProspectDay[] }
