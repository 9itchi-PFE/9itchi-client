import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { quotaReason } from '@/utils/quota'

const answer = (status: number, error: string) => new AxiosError('x', String(status), undefined, undefined, { status, data: { error } } as AxiosResponse)

describe('quotaReason', () => {
    it('tells a plan without the thing from a monthly limit reached', () => {
        expect(quotaReason(answer(402, 'the AI letter is part of the subscription'))).toBe('plan')
        expect(quotaReason(answer(402, 'monthly limit of AI letters of your plan reached'))).toBe('used')
    })
    it('is nothing for another answer', () => {
        expect(quotaReason(answer(502, 'a service is unavailable'))).toBeNull()
        expect(quotaReason(new Error('x'))).toBeNull()
    })
})
