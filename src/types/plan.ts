export type Plan = {
    id: string
    name: string
    price: number
    duration_days: number
    quotas: Record<string, number>
    active: boolean
}

export type PromoCode = {
    id: string
    code: string
    type: 'percentage' | 'fixed'
    value: number
    valid_from: string
    valid_until: string
    usage_limit: number
    plan_ids: string[]
}
