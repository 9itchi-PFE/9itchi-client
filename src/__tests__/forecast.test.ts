import { describe, expect, it } from 'vitest'
import { cycleStart, forecast, ownSpend } from '@/components/admin/forecast'
import type { ProspectDay } from '@/types/prospects'

const DAY = 86_400_000
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)
const day = (d: string, hunter: number): ProspectDay => ({ day: d, searches: 0, contacts_from_pool: 0, contacts_found: 0, credits: { hunter, apollo: 0 } })

describe('cycleStart', () => {
    it('goes back one calendar month, inside the shorter month', () => {
        expect(cycleStart(at('2026-12-15')).toISOString().slice(0, 10)).toBe('2026-11-15')
        expect(cycleStart(at('2026-03-31')).toISOString().slice(0, 10)).toBe('2026-02-28')
        expect(cycleStart(at('2026-01-10')).toISOString().slice(0, 10)).toBe('2025-12-10')
    })
})

describe('forecast', () => {
    it('lasts until the renewal when the pace is low', () => {
        // Cycle 15 Nov -> 15 Dec (30 days), 10 days in, 100 of 1000 used: 10 a day, 20 days to go.
        const f = forecast({ left: 900, limit: 1000, resets_on: '2026-12-15' }, at('2026-11-25'))!
        expect(f.perDay).toBe(10)
        expect(f.projected).toBe(700)
        expect(f.runsOut).toBeNull()
        expect(f.daysEarly).toBe(0)
    })

    it('runs out before the renewal when the pace is high', () => {
        // 10 days in, 600 used: 60 a day, the 400 left last 6.67 days, so out on 1 Dec, 13 days early.
        const f = forecast({ left: 400, limit: 1000, resets_on: '2026-12-15' }, at('2026-11-25'))!
        expect(f.perDay).toBe(60)
        expect(f.projected).toBe(400 - 60 * 20)
        expect(f.runsOut).toBeCloseTo(at('2026-11-25').getTime() + (400 / 60) * DAY)
        expect(f.daysEarly).toBe(13)
    })

    it('counts at least one elapsed day at the start of a cycle', () => {
        const f = forecast({ left: 950, limit: 1000, resets_on: '2026-12-15' }, new Date('2026-11-15T06:00:00Z'))!
        expect(f.perDay).toBe(50)
    })

    it('reads a balance above its limit as nothing used', () => {
        const f = forecast({ left: 1200, limit: 1000, resets_on: '2026-12-15' }, at('2026-11-25'))!
        expect(f.left).toBe(1000)
        expect(f.perDay).toBe(0)
        expect(f.projected).toBe(1000)
        expect(f.runsOut).toBeNull()
    })

    it('has no forecast without a renewal date or a limit', () => {
        expect(forecast({ left: 10, limit: 100, resets_on: '' }, at('2026-11-25'))).toBeNull()
        expect(forecast({ left: 0, limit: 0, resets_on: '2026-12-15' }, at('2026-11-25'))).toBeNull()
    })

    it('runs out at once with nothing left', () => {
        const f = forecast({ left: 0, limit: 1000, resets_on: '2026-12-15' }, at('2026-11-25'))!
        expect(f.runsOut).toBe(at('2026-11-25').getTime())
        expect(f.daysEarly).toBe(20)
    })
})

describe('ownSpend', () => {
    const daily = [day('2026-10-28', 5), day('2026-11-14', 3), day('2026-11-15', 4), day('2026-11-27', 6)]

    it('adds the days from the cycle start', () => {
        expect(ownSpend(daily, 'hunter', at('2026-11-15').getTime())).toEqual({ credits: 10, partial: false })
        expect(ownSpend(daily, 'apollo', at('2026-11-15').getTime())).toEqual({ credits: 0, partial: false })
    })

    it('says when the cycle started before the known days', () => {
        expect(ownSpend(daily, 'hunter', at('2026-10-20').getTime())).toEqual({ credits: 18, partial: true })
    })
})
