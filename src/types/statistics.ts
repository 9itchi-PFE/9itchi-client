// statistics-api: what happened day by day. A metric counts events (user_registered, email_sent, email_opened,
// email_failed, payment_completed...) or sums an amount (revenue_millimes).
export type MetricPoint = { day: string; value: number }
export type MetricSummary = { total: number; series: MetricPoint[] }
export type Dashboard = { from: string; to: string; metrics: Record<string, MetricSummary> }
