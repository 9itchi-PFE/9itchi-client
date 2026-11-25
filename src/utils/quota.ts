import { isAxiosError } from 'axios'

// quotaReason reads a 402 of a service: 'plan' when the student's plan does not include the thing at all, 'used'
// when the plan's limit for the month is reached; null for any other answer.
export function quotaReason(e: unknown): 'plan' | 'used' | null {
    if (!isAxiosError(e) || e.response?.status !== 402) return null
    return /limit/i.test(String(e.response?.data?.error ?? '')) ? 'used' : 'plan'
}
