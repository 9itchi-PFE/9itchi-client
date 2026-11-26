import { describe, expect, it } from 'vitest'
import { warningKeys } from '@/components/resume/check/rewriteWarnings'

describe('warningKeys', () => {
    it('maps the codes to their message keys, once each', () => {
        expect(warningKeys(['new_numbers', 'too_long', 'new_numbers'])).toEqual(['warnNewNumbers', 'warnTooLong'])
    })
    it('is empty when warnings are absent, empty or unknown', () => {
        expect(warningKeys(undefined)).toEqual([])
        expect(warningKeys(null)).toEqual([])
        expect(warningKeys(['something_new'])).toEqual([])
    })
})
