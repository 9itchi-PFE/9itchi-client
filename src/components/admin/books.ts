import type { AutoPublishRun, BookCommon, BookEdit, BookTopic } from '@/types/job'
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

// autoPublishPoll asks for the automatic run again every 3 seconds while it runs.
export const autoPublishPoll = (run: Pick<AutoPublishRun, 'running'> | undefined) => (run?.running ? 3000 : false)

// runFinished is true when a run seen running is now over: the books list is read again then.
export const runFinished = (was: boolean | undefined, now: boolean | undefined) => was === true && now === false

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

// MAX_BATCH is how many PDFs one import takes: they are sent one after the other, and job-api reads two at a time.
export const MAX_BATCH = 20

export type QueueState = 'waiting' | 'sending' | 'sent' | 'failed'
export type QueueError = 'notPdf' | 'tooLarge' | 'scanned' | 'other'
export type QueueItem<F> = { key: string; file: F; company: string; state: QueueState; error?: QueueError; message?: string; bookId?: string }

type FileLike = { name: string; size: number; type: string; lastModified?: number }

const fileKey = (f: FileLike) => `${f.name}|${f.size}|${f.lastModified ?? 0}`

// addToQueue adds the chosen files to the import list: a file already listed is not added twice, the list stops at
// MAX_BATCH (overflow says how many were left out), and a file that is not a PDF or is too large is listed as failed
// so the admin sees why it will not be sent.
export function addToQueue<F extends FileLike>(queue: QueueItem<F>[], files: F[]): { queue: QueueItem<F>[]; overflow: number } {
    const next = [...queue]
    const seen = new Set(queue.map((q) => q.key))
    let overflow = 0
    for (const file of files) {
        const key = fileKey(file)
        if (seen.has(key)) continue
        if (next.length >= MAX_BATCH) {
            overflow++
            continue
        }
        seen.add(key)
        const problem = pdfProblem(file)
        const error = problem === 'notPdf' || problem === 'tooLarge' ? problem : undefined
        next.push({ key, file, company: '', state: problem ? 'failed' : 'waiting', error: problem === 'missing' ? 'other' : error })
    }
    return { queue: next, overflow }
}

// importFailure reads why job-api refused one PDF: 422 is a PDF without text, 413 one too large.
export function importFailure(status: number | undefined): QueueError {
    if (status === 422) return 'scanned'
    if (status === 413) return 'tooLarge'
    return 'other'
}

// sendable is what an import run sends: the files still waiting, and those that failed on the way (not those refused
// before sending, which would fail again).
export const sendable = <F>(q: QueueItem<F>) => q.state === 'waiting' || (q.state === 'failed' && (q.error === 'other' || q.error === undefined))
