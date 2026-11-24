import { describe, expect, it } from 'vitest'
import { rangeOf, rate, share, total, weekOf, weekly } from '@/components/admin/stats'

describe('rangeOf', () => {
    const now = new Date('2026-11-24T21:30:00Z')
    it('covers the period, today included, in UTC days', () => {
        expect(rangeOf('7', now)).toEqual({ from: '2026-11-18', to: '2026-11-24' })
        expect(rangeOf('30', now)).toEqual({ from: '2026-10-26', to: '2026-11-24' })
        // 365 days stay within the 366 statistics-api serves.
        expect(rangeOf('365', now)).toEqual({ from: '2025-11-25', to: '2026-11-24' })
    })
})

describe('figures', () => {
    it('read a total, 0 when the metric is not there', () => {
        const d = { from: '', to: '', metrics: { email_sent: { total: 12, series: [] } } }
        expect(total(d, 'email_sent')).toBe(12)
        expect(total(d, 'revenue_millimes')).toBe(0)
        expect(total(undefined, 'email_sent')).toBe(0)
    })
    it('give a rate only when there is something to compare with', () => {
        expect(rate(55, 100)).toBe(55)
        expect(rate(1, 3)).toBe(33)
        expect(rate(0, 0)).toBeNull()
    })
    it('keep a small bar visible and an empty one empty', () => {
        expect(share(50, 100)).toBe(50)
        expect(share(1, 1000)).toBe(2)
        expect(share(0, 100)).toBe(0)
        expect(share(5, 0)).toBe(0)
    })
})

describe('weeks', () => {
    it('follow the ISO calendar, across a new year too', () => {
        expect(weekOf('2026-11-24')).toEqual({ week: 48, monday: '2026-11-23' })
        expect(weekOf('2026-11-22')).toEqual({ week: 47, monday: '2026-11-16' })
        expect(weekOf('2027-01-01')).toEqual({ week: 53, monday: '2026-12-28' })
        expect(weekOf('2027-01-04')).toEqual({ week: 1, monday: '2027-01-04' })
    })
    it('add the days up and keep the last weeks, oldest first', () => {
        const signups = [
            { day: '2026-11-09', value: 9 },
            { day: '2026-11-16', value: 3 },
            { day: '2026-11-22', value: 4 },
            { day: '2026-11-23', value: 5 },
        ]
        const payments = [{ day: '2026-11-24', value: 2 }]
        expect(weekly([signups, payments], 2)).toEqual([
            { week: 47, monday: '2026-11-16', values: [7, 0] },
            { week: 48, monday: '2026-11-23', values: [5, 2] },
        ])
        expect(weekly([undefined, undefined])).toEqual([])
    })
})
