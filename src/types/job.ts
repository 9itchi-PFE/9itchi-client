import type { Topic, WorkMode } from './preferences'

// Offer list item from job-api GET /jobs (300-character snippet, never the full description).
export type JobSummary = {
    id: string
    title: string
    company: string
    location: string
    contract_type: string
    source_url: string
    source: string
    snippet: string
    posted_at: string
    stipend_tnd: number | null
    duration_months: number | null
    work_mode: WorkMode | null
    starts_on: string | null
    closes_on: string | null
    skills: string[]
    pair_ok: boolean
    book_id: string | null
    easy_apply: boolean
    ref: string | null
    pdf_page: number | null
    places: number | null
    topic: Topic | null
    saved: boolean
}

export type BookBrief = { id: string; company: string; sector: string | null; title: string; year: number; open_jobs: number }

// Full offer from GET /jobs/:id.
export type Job = Omit<JobSummary, 'snippet'> & {
    description: string
    book: BookBrief | null
    created_at: string
    updated_at: string
}

export type JobList = { items: JobSummary[]; total: number; page: number; page_size: number }

export type JobCounts = { open: number; for_you: number; saved: number; new_today: number }

export type Tab = 'for_you' | 'all' | 'saved'

// JobQuery is what the offers screen sends to GET /jobs (empty fields are left out).
export type JobQuery = {
    tab?: Tab
    q?: string
    location?: string
    paid?: boolean
    flexible?: boolean
    easy_apply?: boolean
    pair_ok?: boolean
    topic?: Topic
    duration_months?: number
    start_month?: string
    work_mode?: WorkMode
    book_id?: string
    skill?: string[]
    sort?: 'date' | 'relevance' | 'closing' | 'match'
    page?: number
    page_size?: number
    include_closed?: boolean
}

export type Book = {
    id: string
    company: string
    sector: string | null
    city: string | null
    title: string
    summary: string
    year: number
    published_on: string
    pdf_url: string | null
    pages: number | null
    open_jobs: number
    for_you: number
    created_at: string
    jobs?: JobSummary[]
}

export type BookList = { items: Book[]; total: number; page: number; page_size: number }
