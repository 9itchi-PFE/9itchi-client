// statistics-api: what happened day by day. A metric counts events (user_registered, email_sent, email_opened,
// email_failed, payment_completed...) or sums an amount (revenue_millimes).
export type MetricPoint = { day: string; value: number }
export type MetricSummary = { total: number; series: MetricPoint[] }
export type Dashboard = { from: string; to: string; metrics: Record<string, MetricSummary> }

// Credit tracker: what an AI provider or a plugin consumed this month against the quota the admin set.
// The token itself never comes back, only whether one is set and its last characters.
export type Integration = {
    provider: string
    label: string
    kind: 'ai' | 'plugin'
    unit: string
    quota: number
    used: number
    remaining: number
    percent: number
    has_token: boolean
    token_hint: string
}
export type Integrations = { month: string; integrations: Integration[] }
// quota sets the monthly quota (0 = none); token replaces the API token ('' removes it). Send only what changes.
export type IntegrationUpdate = { quota?: number; token?: string }
