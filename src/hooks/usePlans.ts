import { useQuery } from '@tanstack/react-query'
import PaymentService from '@/services/PaymentService'
import type { MySubscription, Plan } from '@/types/plan'

export function usePlans() {
    return useQuery({
        queryKey: ['plans'],
        queryFn: async () => (await PaymentService.listPlans()).data as { items: Plan[] },
    })
}

export function useMySubscription() {
    return useQuery({
        queryKey: ['subscription'],
        queryFn: async () => (await PaymentService.mySubscription()).data as MySubscription,
    })
}
