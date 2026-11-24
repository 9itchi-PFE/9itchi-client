export type Plan = {
    id: string
    name: string
    price: number
    // regular_price: what the plan normally costs, shown struck through next to price (the amount charged). Absent: none.
    regular_price?: number | null
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

// renews: a new payment is asked when the period ends, until the student stops the subscription (nothing is charged
// automatically). stopped_at: when they stopped it; access still lasts until ends_at.
export type Subscription = {
    id: string
    plan_id: string
    status: string
    amount: number
    starts_at: string
    ends_at: string
    renews: boolean
    stopped_at: string | null
}

export type MySubscription = {
    subscription: Subscription | null
    plan: Plan
    is_free: boolean
    // lapsed: on the free view, the last subscription when it ended unpaid without having been stopped.
    lapsed?: Subscription | null
}

// PromoCheck is payments-api's price for a code on a plan (amounts in TND).
export type PromoCheck = { valid: boolean; discount_amount: number; final_price: number; reason?: string }

// Checkout: payment_url is empty when nothing is due (a 100 % code activates directly).
export type Checkout = { payment_url: string; payment_id: string }

// Payment is one payment and its receipt. Amounts are integer millimes (1/1000 TND).
export type Payment = {
    id: string
    status: 'pending' | 'completed' | 'failed'
    receipt_no: string
    plan_id: string
    plan_name: string
    duration_days: number
    amount_millimes: number
    discount_millimes: number
    // regular_millimes: the plan's regular price the day the payment was opened, when it had one.
    regular_millimes?: number | null
    promo_code: string
    provider: string
    provider_ref: string
    period_start: string | null
    period_end: string | null
    completed_at: string | null
    created_at: string
}

// ReceiptIssuer is the legal information printed on receipts. An empty field is not known yet: the receipt leaves a gap.
export type ReceiptIssuer = {
    legal_name: string
    address: string
    tax_id: string
    vat_mention: string
    complete: boolean
}
