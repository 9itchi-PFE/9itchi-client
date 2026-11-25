import type { BookCommon, BookEdit, BookTopic } from '@/types/job'
import type { WorkMode } from '@/types/preferences'
import { number } from './collect'

// topicState is the « État » of a topic on the check screen: published and hidden topics say so, the others are
// ready or still to check.
export type TopicState = 'published' | 'hidden' | 'ready' | 'check'
export function topicState(t: Pick<BookTopic, 'review_status' | 'ready'>): TopicState {
    if (t.review_status === 'published') return 'published'
    if (t.review_status === 'hidden') return 'hidden'
    return t.ready ? 'ready' : 'check'
}

// canPublish: a topic can be ticked while it waits; a published one is already shown, a hidden one was set aside.
export const canPublish = (t: Pick<BookTopic, 'review_status'>) => t.review_status === 'pending'

// defaultPicked ticks the topics that are ready; one still to check is published only if the admin ticks it.
export const defaultPicked = (topics: BookTopic[]) => topics.filter((t) => canPublish(t) && t.ready).map((t) => t.id)

// tally counts the topics that wait: those ready and those still to check.
export const tally = (topics: BookTopic[]) => {
    const waiting = topics.filter(canPublish)
    return { waiting: waiting.length, ready: waiting.filter((t) => t.ready).length, check: waiting.filter((t) => !t.ready).length }
}

// fileSize gives a size in megabytes (one decimal) or kilobytes; the screen writes the unit in its language.
export function fileSize(bytes: number | null): { value: number; unit: 'mb' | 'kb' } | null {
    if (!bytes || bytes <= 0) return null
    if (bytes >= 1024 * 1024) return { value: Math.round((bytes / (1024 * 1024)) * 10) / 10, unit: 'mb' }
    return { value: Math.max(1, Math.round(bytes / 1024)), unit: 'kb' }
}

// MAX_PDF is the largest PDF job-api accepts (20 MB).
export const MAX_PDF = 20 * 1024 * 1024

// pdfProblem says why a chosen file cannot be imported, before it is sent.
export function pdfProblem(file: { name: string; size: number; type: string } | null | undefined): 'missing' | 'notPdf' | 'tooLarge' | null {
    if (!file || file.size === 0) return 'missing'
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return 'notPdf'
    if (file.size > MAX_PDF) return 'tooLarge'
    return null
}

// bookInput reads the « Informations communes » form.
export function bookInput(f: FormData, year: number): BookEdit {
    const s = (k: string) => String(f.get(k) ?? '').trim()
    const common: BookCommon = {
        location: s('location'),
        starts_on: s('starts_on'),
        closes_on: s('closes_on'),
        duration_months: number(s('duration_months')),
        stipend_tnd: number(s('stipend_tnd')),
        work_mode: s('work_mode') as WorkMode | '',
    }
    return {
        company: s('company'),
        title: s('title'),
        sector: s('sector') || null,
        city: s('city') || null,
        summary: s('summary'),
        year: number(s('year')) ?? year,
        topics: common,
    }
}
