// email-api: applications, the emails behind them and the Gmail connection.

export type EmailStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'

export type EmailBrief = { id: string; recipient: string; subject: string; status: EmailStatus; scheduled_at: string | null; sent_at: string | null }

export type Email = EmailBrief & { job_id: string | null; resume_id: string | null; body: string; created_at: string }

// Allowance is what the plan lets the student send through 9itchi. plan: the CV built in 9itchi, limit per month;
// original: no subscription, the imported file, limit over the life of the account; none: nothing. limit null: none.
export type Allowance = { mode: 'plan' | 'original' | 'none'; limit: number | null; used: number }

export type MatchLevel = 'strong' | 'good' | 'partial' | 'weak'
// JobMatch is the AI's reading of how well the CV fits an offer (email-api), with the plan's analyses this month.
export type JobMatch = {
    score: number
    level: MatchLevel
    strengths: string[]
    gaps: string[]
    advice: string
    created_at: string
    limit: number | null
    used: number
}
export type MatchInput = { job_id: string; resume_id: string; language: 'fr' | 'en' | 'ar' }

// failed is only shown: a scheduled application whose email could not leave.
export type ApplicationStatus = 'scheduled' | 'sent' | 'opened' | 'replied' | 'withdrawn' | 'closed' | 'failed'

// gmail: sent by 9itchi from the student's Gmail; self: the student applied on another site or from their mailbox.
export type Via = 'gmail' | 'self'

export type Application = {
    id: string
    job_id: string
    email_id: string | null
    status: ApplicationStatus
    job_title: string
    company: string
    via: Via
    email: EmailBrief | null
    created_at: string
    updated_at: string
}

export type ApplicationList = { items: Application[] }

export type ApplyInput = { job_id: string; resume_id?: string; via?: Via; subject?: string; body?: string; scheduled_at?: string }

export type Tone = 'formal' | 'friendly'
export type LetterLanguage = 'fr' | 'en' | 'ar'

export type DraftInput = { job_id: string; resume_id?: string; language: LetterLanguage; tone: Tone }
export type Draft = { subject: string; body: string }

export type GmailStatus = { connected: boolean; email?: string; connected_at?: string }

// tracker-api: when the recruiter's mail client loaded the email.
export type EmailStats = { sent_at: string; first_open_at: string | null; last_open_at: string | null; open_count: number }
