import { describe, expect, it } from 'vitest'
import { addToQueue, importFailure, MAX_BATCH, MAX_PDF, sendable } from '@/components/admin/books'

const pdf = (name: string, size = 1000, lastModified = 1) => ({ name, size, type: 'application/pdf', lastModified })

describe('addToQueue', () => {
    it('lists each PDF once, waiting', () => {
        const a = pdf('a.pdf')
        const { queue } = addToQueue([], [a, pdf('b.pdf'), a])
        expect(queue.map((q) => [q.file.name, q.state])).toEqual([
            ['a.pdf', 'waiting'],
            ['b.pdf', 'waiting'],
        ])
        expect(addToQueue(queue, [a]).queue).toHaveLength(2)
    })

    it('lists a file that is not a PDF or too large as failed, with the reason', () => {
        const { queue } = addToQueue([], [{ name: 'notes.docx', size: 10, type: 'application/msword' }, pdf('big.pdf', MAX_PDF + 1)])
        expect(queue.map((q) => [q.state, q.error])).toEqual([
            ['failed', 'notPdf'],
            ['failed', 'tooLarge'],
        ])
        expect(queue.filter(sendable)).toHaveLength(0)
    })

    it('stops at the batch size and says how many were left out', () => {
        const files = Array.from({ length: MAX_BATCH + 3 }, (_, i) => pdf(`b${i}.pdf`))
        const { queue, overflow } = addToQueue([], files)
        expect(queue).toHaveLength(MAX_BATCH)
        expect(overflow).toBe(3)
    })
})

describe('importFailure and sendable', () => {
    it('reads the status of job-api', () => {
        expect(importFailure(422)).toBe('scanned')
        expect(importFailure(413)).toBe('tooLarge')
        expect(importFailure(500)).toBe('other')
        expect(importFailure(undefined)).toBe('other')
    })

    it('sends again a file that failed on the way, not one job-api refused', () => {
        const base = { key: 'k', file: pdf('a.pdf'), company: '' }
        expect(sendable({ ...base, state: 'failed', error: 'other' })).toBe(true)
        expect(sendable({ ...base, state: 'failed', error: 'scanned' })).toBe(false)
        expect(sendable({ ...base, state: 'sent' })).toBe(false)
    })
})

describe('validEmail', () => {
    it('accepts a plain address and refuses a half-typed one', async () => {
        const { validEmail } = await import('@/components/applications/apply')
        expect(validEmail(' rh@beta.tn ')).toBe(true)
        expect(validEmail('rh@beta')).toBe(false)
        expect(validEmail('rh beta@x.tn')).toBe(false)
        expect(validEmail('')).toBe(false)
    })
})
