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
