import { describe, expect, it } from 'vitest'
import { outreachQuery } from '@/components/outreach/outreach'

describe('outreachQuery', () => {
    it('ranks by the CV skills, the search only narrows', () => {
        expect(outreachQuery('', ['React', 'Go'])).toEqual({ q: undefined, skill: ['React', 'Go'], sort: 'match', page_size: 8 })
        expect(outreachQuery(' Safran ', ['React'])).toMatchObject({ q: 'Safran', sort: 'match' })
    })

    it('without skills, sorts by date, or by relevance when searching', () => {
        expect(outreachQuery('', [])).toEqual({ q: undefined, sort: 'date', page_size: 8 })
        expect(outreachQuery('data', [])).toEqual({ q: 'data', sort: 'relevance', page_size: 8 })
    })

    it('sends at most 50 skills, as job-api accepts', () => {
        const many = Array.from({ length: 60 }, (_, i) => `s${i}`)
        expect(outreachQuery('', many).skill).toHaveLength(50)
    })
})
