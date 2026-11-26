// email-api: recruiters a student finds (Recruiter Radar) and emails written from an offer link.
import type { LetterLanguage, Tone } from './application'

export type Recruiter = {
    id: string
    name: string
    title: string
    company: string
    domain: string
    // email is '' when the provider found none: the student can type it.
    email: string
    linkedin_url: string
    confidence: number
    created_at: string
}

// RecruiterAllowance is the plan's daily limit of searches; limit and remaining null: no limit. resets_at is the
// next midnight in Tunis.
export type RecruiterAllowance = { limit: number | null; used: number; remaining: number | null; resets_at: string }

export type RecruiterSearchInput = { resume_id?: string; keywords: string[]; company?: string; domain?: string; location?: string }

// provider 'fake' gives demo people (domains end in .example); cached: the same search was already made today.
export type RecruiterSearch = { search_id: string; provider: string; cached: boolean; items: Recruiter[]; allowance: RecruiterAllowance }

// RecruiterDraftInput asks the AI for a spontaneous application to one recruiter; goal is what the student looks for.
export type RecruiterDraftInput = { resume_id?: string; language: LetterLanguage; tone: Tone; goal?: string; fresh?: boolean }

export type LinkDraftInput = { url: string; offer_text?: string; resume_id?: string; language: LetterLanguage; tone: Tone; fresh?: boolean }
// job_id is set when the link was a 9itchi offer.
export type LinkDraft = {
    subject: string
    body: string
    limit: number | null
    used: number
    job_id: string | null
    offer: { source: string; title: string; company: string }
}

// EmailEdit is what changes in a scheduled email (PATCH /emails/:id); absent fields stay as they are.
export type EmailEdit = { to?: string; subject?: string; body?: string; scheduled_at?: string; attach_cv?: boolean; resume_id?: string }

// OutgoingEmail is POST /emails and /emails/schedule; no resume_id: no CV attached.
export type OutgoingEmail = { job_id?: string; resume_id?: string; to: string; subject: string; body: string; scheduled_at?: string }
