// Notification is one line of the Notifications page, as notification-api returns it. `data` depends on the type:
// the three application types carry company, job_title, application_id and job_id when the offer is known;
// new_matching_jobs carries count; saved_job_closing carries job_id, job_title, company and closes_on (a day);
// cv_tip carries resume_id and count; month_gifted carries ends_at (the instant the subscription now runs until).
export type Notification = {
    id: string
    user_id: string
    type:
        | 'email_opened'
        | 'scheduled_email_sent'
        | 'email_failed'
        | 'new_matching_jobs'
        | 'saved_job_closing'
        | 'cv_tip'
        | 'month_gifted'
        | 'admin_message'
        | 'system'
        | (string & {})
    title: string
    data: Record<string, unknown> | null
    read: boolean
    created_at: string
}

export type NotificationList = { items: Notification[]; total: number; page: number; page_size: number; unread_count: number }

// AlertKind is one line of « Alertes »; email and in_app say where that kind of alert goes.
export type AlertKind = 'applications' | 'matches' | 'closing' | 'tips'
export type AlertPreference = { kind: AlertKind; email: boolean; in_app: boolean }
export type AlertPreferences = { items: AlertPreference[] }
