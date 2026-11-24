import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PaymentService from '@/services/PaymentService'
import type { MySubscription } from '@/types/plan'

export const billingKeys = {
    plans: ['plans'] as const,
    subscription: ['subscription'] as const,
    payments: ['payments'] as const,
}

export function usePlans() {
    return useQuery({ queryKey: billingKeys.plans, queryFn: async () => (await PaymentService.listPlans()).data })
}

export function useMySubscription() {
    return useQuery({ queryKey: billingKeys.subscription, queryFn: async () => (await PaymentService.mySubscription()).data })
}

// usePayments lists the completed payments: the receipts.
export function usePayments() {
    return useQuery({ queryKey: billingKeys.payments, queryFn: async () => (await PaymentService.listPayments()).data.items })
}

export function useValidatePromo() {
    return useMutation({ mutationFn: async (input: { code: string; plan_id: string }) => (await PaymentService.validatePromo(input)).data })
}

export function useCheckout() {
    return useMutation({ mutationFn: async (input: { plan_id: string; promo_code?: string }) => (await PaymentService.checkout(input)).data })
}

// useVerifyPayment asks payments-api where a payment stands; once it is completed everything the plan changes is read again.
export function useVerifyPayment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => (await PaymentService.verifyPayment(id)).data,
        onSuccess: (p) => {
            if (p.status !== 'completed') return
            qc.invalidateQueries({ queryKey: billingKeys.subscription })
            qc.invalidateQueries({ queryKey: billingKeys.payments })
            qc.invalidateQueries({ queryKey: ['downloads'] })
        },
    })
}

// useSetRenewal stops the renewal of the subscription (renews false) or resumes it.
export function useSetRenewal() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (renews: boolean) => (await (renews ? PaymentService.resumeSubscription() : PaymentService.cancelSubscription())).data,
        onSuccess: (s) => qc.setQueryData<MySubscription>(billingKeys.subscription, s),
    })
}
