import type { Checkout, MySubscription, Payment, Plan, PromoCheck } from '@/types/plan'
import { api } from './ApiService'

const PaymentService = {
    listPlans: () => api('payments').get<{ items: Plan[] }>(`/plans`),
    createPlan: (data?: unknown) => api('payments').post(`/admin/plans`, data),
    updatePlan: (id: string, data?: unknown) => api('payments').put(`/admin/plans/${id}`, data),
    deactivatePlan: (id: string) => api('payments').delete(`/admin/plans/${id}`),
    validatePromo: (data: { code: string; plan_id: string }) => api('payments').post<PromoCheck>(`/promo-codes/validate`, data),
    listPromos: () => api('payments').get(`/admin/promo-codes`),
    createPromo: (data?: unknown) => api('payments').post(`/admin/promo-codes`, data),
    updatePromo: (id: string, data?: unknown) => api('payments').put(`/admin/promo-codes/${id}`, data),
    deletePromo: (id: string) => api('payments').delete(`/admin/promo-codes/${id}`),
    checkout: (data: { plan_id: string; promo_code?: string }) => api('payments').post<Checkout>(`/subscriptions/checkout`, data),
    mySubscription: () => api('payments').get<MySubscription>(`/subscriptions/me`),
    listPayments: () => api('payments').get<{ items: Payment[] }>(`/payments`),
    // verifyPayment asks where a payment stands after the return from Flouci (payments-api re-checks it with Flouci).
    verifyPayment: (id: string) => api('payments').post<Payment>(`/payments/${id}/verify`),
    cancelSubscription: (data?: unknown) => api('payments').post(`/subscriptions/cancel`, data),
    webhook: (provider: string, data?: unknown) => api('payments').post(`/webhooks/${provider}`, data),
}

export default PaymentService
