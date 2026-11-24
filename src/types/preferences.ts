// Mirrors job-api's preferences (screen 1.3). null = not answered yet.
export const TOPICS = ['embedded', 'web', 'mobile', 'data', 'cloud', 'security', 'networks'] as const
export type Topic = (typeof TOPICS)[number]
export type WorkMode = 'on_site' | 'hybrid' | 'remote'
export type Team = 'solo' | 'pair' | 'both'

export type Preferences = {
    topics: Topic[]
    skills: string[]
    places: string[]
    work_mode: WorkMode | null
    start_month: string | null // YYYY-MM
    duration_months: number | null
    paid_only: boolean | null
    team: Team | null
}

export type SavedPreferences = Preferences & { unanswered: number; updated_at: string | null }

export const emptyPreferences = (): Preferences => ({
    topics: [],
    skills: [],
    places: [],
    work_mode: null,
    start_month: null,
    duration_months: null,
    paid_only: null,
    team: null,
})
