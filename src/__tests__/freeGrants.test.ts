import { describe, expect, it } from 'vitest'
import { emailsOf, grantQuotas, grantSummary, grantTyped } from '@/components/admin/grants'
import { freeApplications } from '@/components/public/HomeScreen'
import type { Plan } from '@/types/plan'

describe('the emails of a grant', () => {
    it('splits on commas, spaces and new lines, in lower case and each once', () => {
        expect(emailsOf(' Ali@ENIS.tn, sara@gmail.com\nali@enis.tn;\tbob@x.tn  ')).toEqual(['ali@enis.tn', 'sara@gmail.com', 'bob@x.tn'])
    })

    it('is empty when nothing is typed', () => {
        expect(emailsOf(' \n , ')).toEqual([])
    })
})

describe('the quotas of a grant', () => {
    it('sends only the fields filled', () => {
        expect(grantQuotas({ free_applications: '5', emails_per_month: '', resumes: ' 0 ' })).toEqual({ free_applications: 5, resumes: 0 })
    })

    it('refuses a field that is not a whole number from 0', () => {
        expect(grantQuotas({ free_applications: '-1' })).toBeNull()
        expect(grantQuotas({ free_applications: '2.5' })).toBeNull()
    })

    it('needs at least one field', () => {
        expect(grantQuotas({})).toBeNull()
        expect(grantQuotas({ resumes: '  ' })).toBeNull()
    })

    it('reads back into the fields', () => {
        expect(grantTyped({ resumes: 2, free_applications: 0 })).toEqual({ resumes: '2', free_applications: '0' })
    })

    it('is summed up with known keys first, in their order', () => {
        const label = (k: string) => k.toUpperCase()
        expect(grantSummary({ zeta: 1, free_applications: 5, resumes: 2 }, label)).toBe('RESUMES: 2 · FREE_APPLICATIONS: 5 · ZETA: 1')
    })
})

describe('free applications on the public pages', () => {
    const free = (quotas: Record<string, number>): Plan => ({ id: 'f', name: 'Free', price: 0, duration_days: 36500, quotas, active: true })

    it('promises none before the plans answer or when the Free plan gives none', () => {
        expect(freeApplications(undefined)).toBe(0)
        expect(freeApplications([free({ free_applications: 0 })])).toBe(0)
    })

    it('reads the Free plan count', () => {
        expect(freeApplications([free({ free_applications: 3 })])).toBe(3)
    })
})
