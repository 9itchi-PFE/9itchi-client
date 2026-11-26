import type { MySubscription, Plan } from '@/types/plan'

// countLabel is the number a counter badge writes: 1 to 9, then 9+.
export const countLabel = (n: number) => (n > 9 ? '9+' : String(n))

// titleWithCount puts « (N) » before a page title while N > 0, and takes it off again at 0.
export function titleWithCount(title: string, n: number): string {
    const base = title.replace(/^\(\d+\)\s*/, '')
    return n > 0 ? `(${n}) ${base}` : base
}

// premiumPlan is the plan a student pays for, or null on the free view (no subscription, free plan, ended).
export function premiumPlan(sub: Pick<MySubscription, 'subscription' | 'is_free' | 'plan'> | undefined | null): Plan | null {
    if (!sub || sub.is_free || !sub.subscription || !sub.plan) return null
    if (sub.subscription.status && sub.subscription.status !== 'active') return null
    return sub.plan
}
