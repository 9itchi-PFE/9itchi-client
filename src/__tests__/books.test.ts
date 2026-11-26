import { describe, expect, it } from 'vitest'
import { bookInput, canPublish, defaultPicked, fileSize, MAX_PDF, pdfProblem, tally, topicState } from '@/components/admin/books'
import { megabytes, pdfState } from '@/components/jobs/bookPdf'
import type { BookTopic } from '@/types/job'

describe('pdfState', () => {
    it('shows the PDF as soon as there is an address, hosted by the company or kept by 9itchi', () => {
        expect(pdfState({ hostedUrl: 'https://exemple.tn/book.pdf' })).toBe('ready')
        expect(pdfState({ hasKept: true, keptUrl: 'blob:x' })).toBe('ready')
    })
    it('says « none » only for a book that has no PDF at all', () => {
        expect(pdfState({ hostedUrl: null, hasKept: false })).toBe('none')
        expect(pdfState({})).toBe('none')
    })
    it('waits, then offers a retry, for a PDF 9itchi keeps but has not delivered yet', () => {
        expect(pdfState({ hasKept: true })).toBe('loading')
        expect(pdfState({ hasKept: true, failed: false })).toBe('loading')
        expect(pdfState({ hasKept: true, failed: true })).toBe('error')
    })
    it('writes the progress in megabytes', () => {
        expect(megabytes(5_443_242)).toBe('5.2')
        expect(megabytes(0)).toBe('0.0')
    })
})

const topic = (id: string, review_status: BookTopic['review_status'], ready: boolean): BookTopic => ({
    id,
    ref: null,
    title: id,
    topic: null,
    skills: [],
    pdf_page: null,
    review_status,
    ready,
})
const topics = [topic('a', 'pending', true), topic('b', 'pending', false), topic('c', 'published', true), topic('d', 'hidden', true)]

describe('the topics of an imported book', () => {
    it('says ready or to check only for a topic that waits', () => {
        expect(topics.map(topicState)).toEqual(['ready', 'check', 'published', 'hidden'])
    })
    it('ticks the ready topics, never one to check, published or hidden', () => {
        expect(defaultPicked(topics)).toEqual(['a'])
        expect(topics.map(canPublish)).toEqual([true, true, false, false])
    })
    it('counts the topics that wait', () => {
        expect(tally(topics)).toEqual({ waiting: 2, ready: 1, check: 1 })
        expect(tally([])).toEqual({ waiting: 0, ready: 0, check: 0 })
    })
})

describe('the PDF of a book', () => {
    it('is refused before it is sent when it cannot be imported', () => {
        expect(pdfProblem(null)).toBe('missing')
        expect(pdfProblem({ name: 'a.pdf', size: 0, type: 'application/pdf' })).toBe('missing')
        expect(pdfProblem({ name: 'a.docx', size: 10, type: 'application/msword' })).toBe('notPdf')
        expect(pdfProblem({ name: 'a.pdf', size: MAX_PDF + 1, type: 'application/pdf' })).toBe('tooLarge')
        expect(pdfProblem({ name: 'a.pdf', size: MAX_PDF, type: 'application/pdf' })).toBeNull()
        expect(pdfProblem({ name: 'BOOK.PDF', size: 10, type: '' })).toBeNull()
    })
    it('writes its size in megabytes or kilobytes', () => {
        expect(fileSize(null)).toBeNull()
        expect(fileSize(0)).toBeNull()
        expect(fileSize(300)).toEqual({ value: 1, unit: 'kb' })
        expect(fileSize(350 * 1024)).toEqual({ value: 350, unit: 'kb' })
        expect(fileSize(2.44 * 1024 * 1024)).toEqual({ value: 2.4, unit: 'mb' })
    })
})

describe('« Informations communes »', () => {
    it('reads the form: an empty field leaves the topics as they are', () => {
        const f = new FormData()
        for (const [k, v] of Object.entries({
            company: ' Novapay Systems ',
            title: 'PFE Book 2027',
            sector: '',
            city: 'Sfax',
            summary: ' Douze sujets. ',
            year: '2027',
            starts_on: '2027-02-03',
            closes_on: '',
            duration_months: '6',
            stipend_tnd: '',
            work_mode: 'hybrid',
            location: '',
        }))
            f.set(k, v)
        expect(bookInput(f, 2026)).toEqual({
            company: 'Novapay Systems',
            title: 'PFE Book 2027',
            sector: null,
            city: 'Sfax',
            summary: 'Douze sujets.',
            year: 2027,
            topics: { location: '', starts_on: '2027-02-03', closes_on: '', duration_months: 6, stipend_tnd: null, work_mode: 'hybrid' },
        })
        expect(bookInput(new FormData(), 2026).year).toBe(2026)
    })
})
