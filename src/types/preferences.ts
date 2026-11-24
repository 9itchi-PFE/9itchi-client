// Mirrors job-api's preferences (screen 1.3). null = not answered yet.
export const TOPICS = ['embedded', 'web', 'mobile', 'data', 'cloud', 'security', 'networks'] as const
export type Topic = (typeof TOPICS)[number]
export type WorkMode = 'on_site' | 'hybrid' | 'remote'

export type Preferences = {
    topics: Topic[]
    skills: string[]
    places: string[]
    work_modes: WorkMode[]
    start_month: string | null // YYYY-MM
    durations: number[]
}

export type SavedPreferences = Preferences & { unanswered: number; updated_at: string | null }

export const emptyPreferences = (): Preferences => ({
    topics: [],
    skills: [],
    places: [],
    work_modes: [],
    start_month: null,
    durations: [],
})
