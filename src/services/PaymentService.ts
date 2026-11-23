import { api } from './ApiService'

const PaymentService = {
    listPlans: () => api('payments').get(`/plans`),
    createPlan: (data?: unknown) => api('payments').post(`/admin/plans`, data),
    updatePlan: (id: string, data?: unknown) => api('payments').put(`/admin/plans/${id}`, data),
    deactivatePlan: (id: string) => api('payments').delete(`/admin/plans/${id}`),
    validatePromo: (data?: unknown) => api('payments').post(`/promo-codes/validate`, data),
    listPromos: () => api('payments').get(`/admin/promo-codes`),
    createPromo: (data?: unknown) => api('payments').post(`/admin/promo-codes`, data),
    updatePromo: (id: string, data?: unknown) => api('payments').put(`/admin/promo-codes/${id}`, data),
    deletePromo: (id: string) => api('payments').delete(`/admin/promo-codes/${id}`),
    checkout: (data?: unknown) => api('payments').post(`/subscriptions/checkout`, data),
    mySubscription: () => api('payments').get(`/subscriptions/me`),
    cancelSubscription: (data?: unknown) => api('payments').post(`/subscriptions/cancel`, data),
    webhook: (provider: string, data?: unknown) => api('payments').post(`/webhooks/${provider}`, data),
}

export default PaymentService
