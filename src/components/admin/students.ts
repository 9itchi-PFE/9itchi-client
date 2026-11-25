import type { Payment } from '@/types/plan'
import type { UserQuery, UserStatus } from '@/types/user'

export const PAGE_SIZE = 25

// studentsQuery is what the list asks account-api: students only, the search trimmed, the page never below 1.
export function studentsQuery(search: string, status: UserStatus, page: number): UserQuery {
    const q = search.trim().slice(0, 100)
    return { role: 'candidate', page: Math.max(1, Math.floor(page) || 1), page_size: PAGE_SIZE, ...(q ? { q } : {}), ...(status ? { status } : {}) }
}

// pages counts the pages of a list (at least 1).
export function pages(total: number, size = PAGE_SIZE): number {
    return Math.max(1, Math.ceil(total / size))
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// studentId keeps an id from the address bar only when it is one.
export const studentId = (v: unknown) => (typeof v === 'string' && uuid.test(v) ? v.toLowerCase() : '')

export const REFUND_DAYS = 7

// Refund is where a payment stands with the refund rule: refunded in full within 7 days when nothing was used.
// "open": still refundable until `until`; "used": something a subscription pays for was used since the payment;
// "unknown": the payment is recent but what was used could not be read, so nothing is claimed.
export type Refund = { state: 'open'; until: Date } | { state: 'used'; by: 'download' | 'application' | 'both' } | { state: 'unknown' }

// refund applies the rule to one payment. downloadAt and sentAt are the last CV download and the last application
// sent with the CV built in 9itchi (null: never; undefined: not read). null: the rule does not apply (nothing was
// paid, or the 7 days are over).
export function refund(
    p: Pick<Payment, 'completed_at' | 'amount_millimes'>,
    downloadAt: string | null | undefined,
    sentAt: string | null | undefined,
    now: Date,
): Refund | null {
    if (!p.completed_at || p.amount_millimes <= 0) return null
    const paid = new Date(p.completed_at).getTime()
    const until = paid + REFUND_DAYS * 24 * 60 * 60 * 1000
    if (Number.isNaN(paid) || now.getTime() >= until) return null
    const since = (at: string | null | undefined) => !!at && new Date(at).getTime() >= paid
    const download = since(downloadAt)
    const application = since(sentAt)
    if (download || application) return { state: 'used', by: download && application ? 'both' : download ? 'download' : 'application' }
    if (downloadAt === undefined || sentAt === undefined) return { state: 'unknown' }
    return { state: 'open', until: new Date(until) }
}
