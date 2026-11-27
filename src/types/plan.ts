export type Locale = 'fr' | 'en' | 'ar'
// PlanText is what students read about a plan in one language; every field is optional.
export type PlanText = { label?: string; tagline?: string; features?: string[] }
export type PlanDetails = Partial<Record<Locale, PlanText>>

export type Plan = {
    id: string
    name: string
    price: number
    // regular_price: what the plan normally costs, shown struck through next to price (the amount charged). Absent: none.
    regular_price?: number | null
    // launch_ends_on: the last day (YYYY-MM-DD) price is charged; from the next day the plan costs regular_price.
    // Absent: the launch price has no end, or is already over (payments-api then returns the regular price as price).
    launch_ends_on?: string
    // sale: the sale the plan is in today (students only). price is then the price of the sale and regular_price
    // the usual one; ends_on is its last day (YYYY-MM-DD).
    sale?: { name: string; percent: number; ends_on: string }
    duration_days: number
    quotas: Record<string, number>
    active: boolean
    // details: what students read about the plan, per language (always an object, may be empty).
    details?: PlanDetails
}

export type PromoCode = {
    id: string
    code: string
    type: 'percentage' | 'fixed'
    value: number
    valid_from: string
    valid_until: string
    // usage_limit 0: no limit. used_count: how many payments used the code.
    usage_limit: number
    used_count: number
    plan_ids: string[]
}

// Sale is a reduction without a code between two days, both included (YYYY-MM-DD, counted in Tunis).
// plan_ids empty: every paid plan. state is where it stands today.
export type Sale = {
    id: string
    name: string
    percent: number
    starts_on: string
    ends_on: string
    plan_ids: string[]
    state: 'upcoming' | 'running' | 'over'
}
export type SaleInput = Omit<Sale, 'id' | 'state'>

// PlanInput and PromoInput are what the admin saves (payments-api replaces the whole row).
export type PlanInput = Pick<Plan, 'name' | 'price' | 'duration_days' | 'quotas' | 'active'> & {
    regular_price?: number
    launch_ends_on?: string
    details?: PlanDetails
}
export type PromoInput = Omit<PromoCode, 'id' | 'used_count'>
export type ReceiptIssuerInput = Omit<ReceiptIssuer, 'complete'>

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
    // kept_price: the launch price the student keeps when they renew with no gap of more than 7 days (null: none).
    // When it is lower than today's price, plan is already shown at it.
    kept_price?: number | null
}

// atKeptPrice is plan at the launch price a student keeps, today's price struck through; plan as it is otherwise.
export function atKeptPrice(plan: Plan, kept?: number | null): Plan {
    if (kept == null || kept >= plan.price) return plan
    const usual = plan.regular_price && plan.regular_price > plan.price ? plan.regular_price : plan.price
    return { ...plan, price: kept, regular_price: usual, launch_ends_on: undefined, sale: undefined }
}

// Gift is a month the team gave a student: the plan and the days it added, and the admin who gave it.
export type Gift = {
    id: string
    plan_id: string
    plan_name: string
    days: number
    given_by: string
    period_start: string
    period_end: string
    created_at: string
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
    // sale_name: the sale the payment was opened in, when there was one.
    sale_name?: string
    // student_percent: the student discount taken off after any promo code (part of discount_millimes).
    student_percent?: number
    promo_code: string
    provider: string
    provider_ref: string
    period_start: string | null
    period_end: string | null
    completed_at: string | null
    created_at: string
}

// StudentDiscount is the percentage taken off at checkout for a verified email on one of the student domains
// (a subdomain counts too). 0 switches it off. It stacks on top of a sale or a promo code.
export type StudentDiscount = {
    percent: number
    domains: string[]
}

// MyStudentDiscount says whether the signed-in student gets it. needs_verified_email: the email is on a student
// domain but was never confirmed by a Google or LinkedIn sign-in.
export type MyStudentDiscount = {
    eligible: boolean
    percent: number
    domain?: string
    needs_verified_email?: boolean
}

// ReceiptIssuer is the legal information printed on receipts. An empty field is not known yet: the receipt leaves a gap.
export type ReceiptIssuer = {
    legal_name: string
    address: string
    tax_id: string
    vat_mention: string
    complete: boolean
}
