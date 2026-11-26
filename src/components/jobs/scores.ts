import type { ScoreInput, ScoreItem, ScoreList } from '@/types/application'

// AI_BATCH is how many offers of « Pour toi » the AI scores once a day, the first ones not scored yet.
export const AI_BATCH = 5

export type Scores = { items: Record<string, ScoreItem>; allowance: { limit: number | null; used: number } | null }

// known says whether the AI already gave an offer a score worth showing (made now or before).
export const known = (s: ScoreItem | undefined) => !!s && (s.status === 'ok' || s.status === 'cached')

// toRun picks the offers to send to the AI: the first ones of the list without a score, at most AI_BATCH.
export function toRun(ids: string[], items: Record<string, ScoreItem>, max = AI_BATCH): string[] {
    return ids.filter((id) => !known(items[id])).slice(0, max)
}

type ScoreCalls = {
    cached: (input: ScoreInput) => Promise<{ data: ScoreList }>
    score: (input: ScoreInput) => Promise<{ data: ScoreList }>
}

const byJob = (list: ScoreItem[]) => Object.fromEntries(list.map((s) => [s.job_id, s]))

// loadScores reads the scores already made for the visible offers (free), then asks the AI for the first ones
// still without one. A failed call keeps what was read: the list never waits on the AI to show.
export async function loadScores(input: ScoreInput, calls: ScoreCalls): Promise<Scores> {
    const ids = input.job_ids.slice(0, 10)
    let items: Record<string, ScoreItem> = {}
    if (!ids.length) return { items, allowance: null }
    try {
        items = byJob((await calls.cached({ ...input, job_ids: ids })).data.items ?? [])
    } catch {
        // Nothing cached to show: the AI is asked below.
    }
    const run = toRun(ids, items)
    if (!run.length) return { items, allowance: null }
    try {
        const made = (await calls.score({ ...input, job_ids: run })).data
        return { items: { ...items, ...byJob(made.items ?? []) }, allowance: made.allowance ?? null }
    } catch {
        return { items, allowance: null }
    }
}
