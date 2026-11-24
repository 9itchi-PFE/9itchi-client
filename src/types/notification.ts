// Notification is one line of the Notifications page, as notification-api returns it. `data` depends on the type:
// the three application types carry company, job_title, application_id and job_id when the offer is known.
export type Notification = {
    id: string
    user_id: string
    type: 'email_opened' | 'scheduled_email_sent' | 'email_failed' | 'new_matching_jobs' | 'admin_message' | 'system' | (string & {})
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
