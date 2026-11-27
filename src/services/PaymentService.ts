import type {
    Checkout,
    FreeGrant,
    FreeGrantInput,
    Gift,
    MySubscription,
    Payment,
    Plan,
    PlanInput,
    PromoCheck,
    PromoCode,
    PromoInput,
    Sale,
    SaleInput,
    ReceiptIssuer,
    ReceiptIssuerInput,
    StudentDiscount,
    MyStudentDiscount,
} from '@/types/plan'
import { api } from './ApiService'

const PaymentService = {
    listPlans: () => api('payments').get<{ items: Plan[] }>(`/plans`),
    createPlan: (data: PlanInput) => api('payments').post<Plan>(`/admin/plans`, data),
    // listAllPlans also returns the plans that are switched off (admin).
    listAllPlans: () => api('payments').get<{ items: Plan[] }>(`/admin/plans`),
    updatePlan: (id: string, data: PlanInput) => api('payments').put<Plan>(`/admin/plans/${id}`, data),
    deactivatePlan: (id: string) => api('payments').delete(`/admin/plans/${id}`),
    validatePromo: (data: { code: string; plan_id: string }) => api('payments').post<PromoCheck>(`/promo-codes/validate`, data),
    listPromos: () => api('payments').get<{ items: PromoCode[] }>(`/admin/promo-codes`),
    createPromo: (data: PromoInput) => api('payments').post<PromoCode>(`/admin/promo-codes`, data),
    updatePromo: (id: string, data: PromoInput) => api('payments').put<PromoCode>(`/admin/promo-codes/${id}`, data),
    deletePromo: (id: string) => api('payments').delete(`/admin/promo-codes/${id}`),
    // Sales: reductions without a code, between two days (admin).
    listSales: () => api('payments').get<{ items: Sale[] }>(`/admin/sales`),
    createSale: (data: SaleInput) => api('payments').post<Sale>(`/admin/sales`, data),
    updateSale: (id: string, data: SaleInput) => api('payments').put<Sale>(`/admin/sales/${id}`, data),
    deleteSale: (id: string) => api('payments').delete(`/admin/sales/${id}`),
    // Free usage the team gives some emails (admin): giving again to an email replaces its quotas.
    listFreeGrants: () => api('payments').get<FreeGrant[]>(`/admin/free-grants`),
    giveFreeGrants: (data: FreeGrantInput) => api('payments').post<FreeGrant[]>(`/admin/free-grants`, data),
    updateFreeGrant: (email: string, data: { quotas: Record<string, number>; note: string }) =>
        api('payments').put<FreeGrant>(`/admin/free-grants/${encodeURIComponent(email)}`, data),
    deleteFreeGrant: (email: string) => api('payments').delete(`/admin/free-grants/${encodeURIComponent(email)}`),
    checkout: (data: { plan_id: string; promo_code?: string }) => api('payments').post<Checkout>(`/subscriptions/checkout`, data),
    mySubscription: () => api('payments').get<MySubscription>(`/subscriptions/me`),
    listPayments: () => api('payments').get<{ items: Payment[] }>(`/payments`),
    // userSubscription and userPayments are the plan and the completed payments of one student (admin).
    userSubscription: (userId: string) => api('payments').get<MySubscription>(`/admin/users/${userId}/subscription`),
    userPayments: (userId: string) => api('payments').get<{ items: Payment[] }>(`/admin/users/${userId}/payments`),
    // userGifts are the months the team gave a student; giveMonth adds one (30 days, no payment).
    userGifts: (userId: string) => api('payments').get<{ items: Gift[] }>(`/admin/users/${userId}/gifts`),
    giveMonth: (userId: string) => api('payments').post<Gift>(`/admin/users/${userId}/gifts`),
    // verifyPayment asks where a payment stands after the return from Flouci (payments-api re-checks it with Flouci).
    verifyPayment: (id: string) => api('payments').post<Payment>(`/payments/${id}/verify`),
    // receiptIssuer is who issues the receipts (legal name, address, tax id, VAT wording), as the admin filled it in.
    receiptIssuer: () => api('payments').get<ReceiptIssuer>(`/receipt-issuer`),
    updateReceiptIssuer: (data: ReceiptIssuerInput) => api('payments').put<ReceiptIssuer>(`/admin/receipt-issuer`, data),
    // Student discount: the admin sets a percentage and the student email domains; myStudentDiscount says whether it applies.
    studentDiscount: () => api('payments').get<StudentDiscount>(`/admin/student-discount`),
    updateStudentDiscount: (data: StudentDiscount) => api('payments').put<StudentDiscount>(`/admin/student-discount`, data),
    myStudentDiscount: () => api('payments').get<MyStudentDiscount>(`/student-discount/me`),
    // cancel stops the renewal (access lasts until the period ends); resume renews again.
    cancelSubscription: () => api('payments').post<MySubscription>(`/subscriptions/cancel`),
    resumeSubscription: () => api('payments').post<MySubscription>(`/subscriptions/resume`),
    webhook: (provider: string, data?: unknown) => api('payments').post(`/webhooks/${provider}`, data),
}

export default PaymentService
