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
    // match_score: how much of the offer the CV's skills cover (0-100), null when the student has no skills.
    match_score?: number | null
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
    // has_pdf: 9itchi keeps the PDF and serves it to signed-in users (GET /books/:id only).
    has_pdf?: boolean
    jobs?: JobSummary[]
}

// Admin: a PFE book imported from its PDF (job-api /admin/books). importing: the PDF is being read; draft: to
// check; failed: import_error says why; published: students see it.
export type BookStatus = 'importing' | 'draft' | 'failed' | 'published'
export type BookImportError = '' | 'ai_unavailable' | 'no_topics' | 'storage_error' | 'already_known' | 'partial'

// BookTopic is one topic on the check screen; ready is false when the subject is short or names no skill.
export type BookTopic = {
    id: string
    ref: string | null
    title: string
    topic: string | null
    skills: string[]
    pdf_page: number | null
    review_status: ReviewStatus
    ready: boolean
    // review_note says why the automatic run left it pending (French text from job-api).
    review_note?: string
}

// BookCommon is what « Informations communes » applies to the topics not published yet; empty leaves them alone.
export type BookCommon = {
    location: string
    starts_on: string
    closes_on: string
    duration_months: number | null
    stipend_tnd: number | null
    work_mode: WorkMode | ''
}

export type AdminBook = Book & {
    status: BookStatus
    import_error: BookImportError
    file_name: string | null
    file_size: number | null
    counts: { pending: number; published: number; hidden: number }
    topics?: BookTopic[]
    common?: BookCommon | null
}

// AutoPublishRun is the last automatic publication of the read books (GET /admin/books/auto-publish).
export type AutoPublishRun = {
    running: boolean
    started_at: string | null
    finished_at: string | null
    books_published: number
    topics_published: number
    topics_left: number
    offers_published: number
    retried: number
    errors: number
}

export type BookEdit = { company: string; sector: string | null; city: string | null; title: string; summary: string; year: number; topics: BookCommon }

export type BookList = { items: Book[]; total: number; page: number; page_size: number }

// Admin: collection sources and the review queue (job-api /admin/*).
// BOARD_KINDS are the job boards job-api reads as a whole, not one company's careers page.
export const BOARD_KINDS = [
    'tanitjobs',
    'keejob',
    'remoteok',
    'remotive',
    'himalayas',
    'jobicy',
    'arbeitnow',
    'landingjobs',
    'weworkremotely',
    'adzuna',
    'jsearch',
    'theirstack',
    'careerjet',
] as const
export type BoardKind = (typeof BOARD_KINDS)[number]
export type SourceKind = 'lever' | 'lever_eu' | 'greenhouse' | 'recruitee' | 'workable' | 'smartrecruiters' | 'page' | BoardKind
export type SourceState = 'idle' | 'running' | 'ok' | 'error'

export type Source = {
    id: string
    company: string
    careers_url: string
    kind: SourceKind
    board: string
    places: string[]
    every_hours: number
    enabled: boolean
    state: SourceState
    last_run_at: string | null
    last_found: number
    last_new: number
    last_error: string
    note: string
    // Boards: paused until blocked_until after fail_count failures; calls_used paid calls this month out of monthly_cap (0: no cap).
    blocked_until: string | null
    fail_count: number
    monthly_cap: number
    calls_used: number
}

// SourceInput replaces the source on PATCH, so monthly_cap is sent back each time. No kind: job-api reads it from the URL.
export type SourceInput = Pick<Source, 'company' | 'careers_url' | 'places' | 'every_hours' | 'enabled' | 'note' | 'monthly_cap'> & { kind?: SourceKind }

export type CollectStats = { online: number; online_from_book: number; new_24h: number; duplicates_24h: number; expired_24h: number; pending: number }

export type SourceList = { stats: CollectStats; items: Source[] }

export type Origin = 'feed' | 'site' | 'link' | 'book' | 'board'
export const ORIGINS: Origin[] = ['feed', 'site', 'link', 'book', 'board']
// ReviewFilter narrows the review queue, and its tab counts, to one source or one origin.
export type ReviewFilter = { source_id?: string; origin?: Origin }
export type ReviewStatus = 'pending' | 'published' | 'hidden'
export type ReviewTab = 'pending' | 'expired' | 'hidden'

export type ReviewItem = {
    id: string
    title: string
    company: string
    origin: Origin
    review_status: ReviewStatus
    closes_on: string | null
    created_at: string
    review_note?: string
}

export type ReviewList = { items: ReviewItem[]; total: number; page: number; page_size: number; counts: Record<ReviewTab, number> }

export type CheckKey = 'company_known' | 'deadline_not_passed' | 'subject_and_skills' | 'start_date'

export type ReviewJob = Job & {
    review_status: ReviewStatus
    origin: Origin
    apply_email: string | null
    checks: { key: CheckKey; ok: boolean }[]
    review_note?: string
}

export type JobEdit = {
    title: string
    company: string
    location: string
    description: string
    stipend_tnd: number | null
    duration_months: number | null
    work_mode: WorkMode | ''
    starts_on: string
    closes_on: string
    skills: string[]
    pair_ok: boolean
    topic: Topic | ''
    apply_email: string
}

export type PostImport = { url: string; text: string; company?: string }

// PublicJob is a published offer as anyone with its link sees it, with no account (screen 7.2).
export type PublicJob = {
    id: string
    title: string
    company: string
    location: string
    contract_type: string
    source: string
    description: string
    stipend_tnd: number | null
    duration_months: number | null
    work_mode: string | null
    closes_on: string | null
    starts_on: string | null
    skills: string[] | null
    pair_ok: boolean
    easy_apply: boolean
    topic: string | null
    book_company: string
    book_title: string
    closed: boolean
    // When it was first published (job-api fills it for search engines; absent from an older job-api).
    posted_at?: string
}

// PublicFacet is a city or a company with how many open offers it has (job-api GET /public/offers).
export type PublicFacet = { slug: string; name: string; count: number }

// PublicOfferItem is an offer in a public list page: no recruiter address, no source link.
export type PublicOfferItem = Pick<
    JobSummary,
    'id' | 'title' | 'company' | 'location' | 'snippet' | 'posted_at' | 'stipend_tnd' | 'duration_months' | 'work_mode' | 'closes_on' | 'skills' | 'easy_apply'
>

// PublicOffers is a page of GET /public/offers, for the pages search engines index (all, a city, a company).
export type PublicOffers = {
    items: PublicOfferItem[]
    total: number
    page: number
    page_size: number
    city?: PublicFacet
    company?: PublicFacet
    cities: PublicFacet[]
    companies: PublicFacet[]
}
