export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'opened' | 'failed'

export type Email = {
    id: string
    job_id?: string
    resume_id?: string
    subject: string
    body: string
    status: EmailStatus
    scheduled_at?: string
    tracking_id?: string
}
