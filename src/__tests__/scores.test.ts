import { describe, expect, it, vi } from 'vitest'
import { boardKind, cap, health } from '@/components/admin/collect'
import { COUNTS } from '@/components/admin/plans'
import { match, strongFit } from '@/components/jobs/offer'
import { AI_BATCH, known, loadScores, toRun } from '@/components/jobs/scores'
import type { ScoreInput, ScoreItem, ScoreList } from '@/types/application'

const item = (job_id: string, status: ScoreItem['status'] = 'ok', score = 70): ScoreItem => ({ job_id, score, level: 'good', reasons: ['React'], status })

describe('strongFit', () => {
    it('follows job-api match_score from 50', () => {
        const m = match(['Go', 'SQL'], ['Go', 'SQL'])
        expect(strongFit(50, null)).toBe(true)
        expect(strongFit(49, m)).toBe(false)
        expect(strongFit(0, m)).toBe(false)
    })
    it('falls back to the skills of the CV when there is no match_score', () => {
        expect(strongFit(null, match(['Go', 'SQL'], ['go']))).toBe(true)
        expect(strongFit(undefined, match(['Go', 'SQL', 'C'], ['go']))).toBe(false)
        expect(strongFit(null, null)).toBe(false)
    })
})

describe('toRun', () => {
    it('picks the first offers without a usable score, at most AI_BATCH', () => {
        const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        const items = { a: item('a', 'cached'), b: item('b', 'quota'), c: item('c', 'error'), d: item('d', 'ok') }
        expect(toRun(ids, items)).toEqual(['b', 'c', 'e', 'f', 'g'])
        expect(toRun(ids, items).length).toBe(AI_BATCH)
        expect(known(items.a) && known(items.d) && !known(items.b) && !known(undefined)).toBe(true)
    })
})

describe('loadScores', () => {
    const input: ScoreInput = { resume_id: 'r1', language: 'fr', job_ids: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'] }
    const reply = (data: ScoreList) => Promise.resolve({ data })

    it('reads the cached scores first, then asks the AI for the first five without one', async () => {
        const cached = vi.fn((i: ScoreInput) => reply({ items: [item('a', 'cached'), item('c', 'cached')].filter((s) => i.job_ids.includes(s.job_id)) }))
        const score = vi.fn((i: ScoreInput) => reply({ items: i.job_ids.map((id) => item(id)), allowance: { limit: 15, used: 5 } }))
        const out = await loadScores(input, { cached, score })
        expect(cached.mock.calls[0][0].job_ids).toHaveLength(10)
        expect(score).toHaveBeenCalledTimes(1)
        expect(score.mock.calls[0][0].job_ids).toEqual(['b', 'd', 'e', 'f', 'g'])
        expect(Object.keys(out.items).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
        expect(out.allowance).toEqual({ limit: 15, used: 5 })
    })
    it('does not ask the AI when every visible offer is scored', async () => {
        const score = vi.fn()
        const out = await loadScores({ ...input, job_ids: ['a'] }, { cached: () => reply({ items: [item('a', 'cached')] }), score })
        expect(score).not.toHaveBeenCalled()
        expect(out.items.a.status).toBe('cached')
    })
    it('keeps the cached scores when the AI fails, and asks it when the cache fails', async () => {
        const out = await loadScores(input, { cached: () => reply({ items: [item('a', 'cached')] }), score: () => Promise.reject(new Error('502')) })
        expect(Object.keys(out.items)).toEqual(['a'])
        expect(out.allowance).toBeNull()
        const out2 = await loadScores(input, { cached: () => Promise.reject(new Error('down')), score: (i) => reply({ items: [item(i.job_ids[0], 'quota')] }) })
        expect(out2.items.a.status).toBe('quota')
    })
    it('asks nothing without offers', async () => {
        const cached = vi.fn()
        expect(await loadScores({ ...input, job_ids: [] }, { cached, score: cached })).toEqual({ items: {}, allowance: null })
        expect(cached).not.toHaveBeenCalled()
    })
})

describe('board sources', () => {
    const now = new Date('2026-11-26T10:00:00Z')
    it('shows a pause only while it lasts, the failures and the paid calls', () => {
        expect(health({ blocked_until: '2026-11-26T12:00:00Z', fail_count: 3, monthly_cap: 100, calls_used: 12 }, now)).toEqual({
            blockedUntil: new Date('2026-11-26T12:00:00Z'),
            fails: 3,
            calls: { used: 12, cap: 100 },
        })
        expect(health({ blocked_until: '2026-11-26T09:00:00Z', fail_count: 0, monthly_cap: 0, calls_used: 0 }, now)).toEqual({
            blockedUntil: null,
            fails: 0,
            calls: null,
        })
    })
    it('reads the cap field and the kind the form starts on', () => {
        expect(cap('250')).toBe(250)
        expect(cap('')).toBe(0)
        expect(cap('-3')).toBe(0)
        expect(boardKind('adzuna')).toBe('adzuna')
        expect(boardKind('greenhouse')).toBe('')
        expect(boardKind(undefined)).toBe('')
    })
    it('lists the daily AI scores among the plan limits', () => {
        expect(COUNTS).toContain('ai_scores_per_day')
    })
})
