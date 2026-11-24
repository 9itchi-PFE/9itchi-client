export type ServiceName = 'account' | 'resume' | 'ai' | 'job' | 'email' | 'tracker' | 'notification' | 'chat' | 'payments' | 'statistics' | 'schedule'

export const serviceNames: ServiceName[] = ['account', 'resume', 'ai', 'job', 'email', 'tracker', 'notification', 'chat', 'payments', 'statistics', 'schedule']

const baseUrls: Record<ServiceName, string | undefined> = {
    account: process.env.NEXT_PUBLIC_ACCOUNT_API_BASE_URL,
    resume: process.env.NEXT_PUBLIC_RESUME_API_BASE_URL,
    ai: process.env.NEXT_PUBLIC_AI_API_BASE_URL,
    job: process.env.NEXT_PUBLIC_JOB_API_BASE_URL,
    email: process.env.NEXT_PUBLIC_EMAIL_API_BASE_URL,
    tracker: process.env.NEXT_PUBLIC_TRACKER_API_BASE_URL,
    notification: process.env.NEXT_PUBLIC_NOTIFICATION_API_BASE_URL,
    chat: process.env.NEXT_PUBLIC_CHAT_API_BASE_URL,
    payments: process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL,
    statistics: process.env.NEXT_PUBLIC_STATISTICS_API_BASE_URL,
    schedule: process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL,
}

// Dev (NEXT_PUBLIC_USE_PROXY=false) calls backends directly; production goes through /api/proxy/[service].
export function getServiceBaseUrl(service: ServiceName): string {
    if (process.env.NEXT_PUBLIC_USE_PROXY === 'true') return `/api/proxy/${service}`
    return baseUrls[service] ?? ''
}

// getServerBaseUrl is the URL the Next server uses to reach a backend (proxy, sign-in): {SERVICE}_API_URL
// when set (an internal address), else the public one. Read at run time, never sent to the browser.
export function getServerBaseUrl(service: ServiceName): string {
    return process.env[`${service.toUpperCase()}_API_URL`] ?? baseUrls[service] ?? ''
}
