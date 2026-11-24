import { describe, expect, it } from 'vitest'
import { bookFacts } from '@/components/jobs/bookFacts'
import { defaultFilters, filtered, fromSearch, relaxations, searching, toJobQuery, toSearch } from '@/components/jobs/filters'
import { nextMonths } from '@/components/jobs/MoreFilters'
import { daysLeft, deadline, fresh, initials, match, sourceName, tint } from '@/components/jobs/offer'
import { toParams } from '@/services/JobService'

const now = new Date(2026, 10, 23, 15, 0) // 23 Nov 2026, afternoon

describe('offer helpers', () => {
    it('initials and tint', () => {
        expect(initials('Novapay Systems')).toBe('NS')
        expect(initials('Medina')).toBe('ME')
        expect(initials('  ')).toBe('?')
        expect(initials('Sofrecom-Tunisie')).toBe('ST')
        expect(tint('Novapay')).toBe(tint('novapay'))
    })

    it('match splits skills case-insensitively', () => {
        expect(match(['C++', 'Linux', 'SQLite', 'CMake'], ['c++', ' linux '])).toEqual({ fits: ['C++', 'Linux'], others: ['SQLite', 'CMake'], strong: true })
        expect(match(['Python', 'OpenCV', 'ONNX'], ['Python'])?.strong).toBe(false)
        expect(match([], ['Python'])).toBeNull()
    })

    it('deadline reads soon, on a date, or closed', () => {
        expect(daysLeft('2026-11-23', now)).toBe(0)
        expect(deadline('2026-11-26', now)).toEqual({ kind: 'soon', days: 3 })
        expect(deadline('2026-12-15', now)?.kind).toBe('on')
        expect(deadline('2026-11-12', now)?.kind).toBe('closed')
        expect(deadline(null, now)).toBeNull()
    })

    it('fresh and source names', () => {
        expect(fresh('2026-11-22T10:00:00Z', now)).toBe(true)
        expect(fresh('2026-11-10T10:00:00Z', now)).toBe(false)
        expect(sourceName('tanitjobs')).toBe('Tanitjobs')
        expect(sourceName('LinkedIn')).toBe('LinkedIn')
        expect(sourceName('monsite')).toBe('Monsite')
    })
})

describe('offer filters in the URL', () => {
    it('round-trips and ignores bad values', () => {
        const f = {
            ...defaultFilters,
            tab: 'all' as const,
            q: 'React',
            location: 'Sousse',
            paid: true,
            length: 6,
            start: '2027-02',
            mode: 'remote' as const,
            topic: 'web' as const,
        }
        const back = fromSearch(new URLSearchParams(toSearch(f)))
        expect(back).toEqual(f)
        expect(toSearch(defaultFilters)).toBe('')
        const bad = fromSearch(new URLSearchParams('tab=x&length=40&start=2027-13&mode=moon&topic=ai&paid=yes'))
        expect(bad).toEqual({ ...defaultFilters, topic: undefined, length: undefined, start: undefined, mode: undefined })
    })

    it('builds the job-api query; the saved tab ignores the search', () => {
        const f = { ...defaultFilters, q: ' React ', paid: true, length: 6 }
        expect(toJobQuery(f, [])).toMatchObject({ tab: 'for_you', q: 'React', paid: true, duration_months: 6, sort: 'relevance' })
        expect(toJobQuery(f, ['C++'])).toMatchObject({ skill: ['C++'], sort: 'match' })
        expect(toJobQuery(f, [], 'saved')).toEqual({ tab: 'saved', skill: undefined, sort: 'date' })
        expect(toParams(toJobQuery(f, ['C++', 'Linux'])).toString()).toBe(
            'tab=for_you&q=React&paid=true&duration_months=6&skill=C%2B%2B&skill=Linux&sort=match',
        )
    })

    it('lists what an empty search can drop', () => {
        const f = { ...defaultFilters, q: 'React', location: 'Sousse', paid: true, length: 6 }
        expect(relaxations(f).map((r) => r.key)).toEqual(['relaxPlace', 'relaxPaid', 'relaxLength'])
        expect(relaxations(f)[1].filters).toMatchObject({ paid: false, location: 'Sousse', q: 'React' })
        expect(searching(f)).toBe(true)
        expect(searching({ ...defaultFilters, paid: true })).toBe(false)
        expect(filtered({ ...defaultFilters, paid: true })).toBe(true)
        expect(filtered(defaultFilters)).toBe(false)
    })

    it('offers the next twelve start months', () => {
        expect(nextMonths(now)).toHaveLength(12)
        expect(nextMonths(now)[0]).toBe('2026-11')
        expect(nextMonths(now)[2]).toBe('2027-01')
    })
})

describe('bookFacts', () => {
    const t = (o: Partial<Parameters<typeof bookFacts>[0][number]>) => ({
        starts_on: null,
        closes_on: null,
        duration_months: null,
        stipend_tnd: null,
        location: 'Sfax',
        work_mode: null,
        ...o,
    })
    it('sums up the open topics', () => {
        const f = bookFacts(
            [
                t({ starts_on: '2027-02-10', duration_months: 6, stipend_tnd: 800, work_mode: 'hybrid', closes_on: '2026-11-26' }),
                t({ starts_on: '2027-02-03', duration_months: 4, stipend_tnd: 800, work_mode: 'hybrid', closes_on: '2026-12-01' }),
                t({ starts_on: '2027-01-01', duration_months: 12, stipend_tnd: 2000, closes_on: '2026-11-01' }),
            ],
            null,
            now,
        )
        expect(f).toEqual({ start: '2027-02-03', length: [4, 6], pay: [800, 800], place: 'Sfax', mode: 'hybrid', deadline: { date: '2026-11-26', days: 3 } })
    })
    it('says unpaid, keeps the book city, leaves unknown facts out', () => {
        expect(bookFacts([t({ stipend_tnd: 0 })], 'Tunis', now)).toEqual({
            pay: 'unpaid',
            place: 'Tunis',
            start: undefined,
            length: undefined,
            mode: undefined,
            deadline: undefined,
        })
    })
})
