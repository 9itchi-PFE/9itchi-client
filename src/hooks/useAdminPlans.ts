import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PaymentService from '@/services/PaymentService'
import type { PlanInput, PromoInput, ReceiptIssuer, ReceiptIssuerInput } from '@/types/plan'
import { billingKeys } from './usePlans'

export const adminPlanKeys = {
    plans: ['admin', 'plans'] as const,
    promos: ['admin', 'promo-codes'] as const,
}

// useAllPlans lists every plan, the ones that are switched off too.
export function useAllPlans() {
    return useQuery({ queryKey: adminPlanKeys.plans, queryFn: async () => (await PaymentService.listAllPlans()).data.items })
}

// useSavePlan saves a plan; the prices students see are read again.
export function useSavePlan() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, input }: { id: string; input: PlanInput }) => (await PaymentService.updatePlan(id, input)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminPlanKeys.plans })
            qc.invalidateQueries({ queryKey: billingKeys.plans })
        },
    })
}

export function usePromos() {
    return useQuery({ queryKey: adminPlanKeys.promos, queryFn: async () => (await PaymentService.listPromos()).data.items })
}

export function useSavePromo() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, input }: { id?: string; input: PromoInput }) =>
            (await (id ? PaymentService.updatePromo(id, input) : PaymentService.createPromo(input))).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: adminPlanKeys.promos }),
    })
}

export function useDeletePromo() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => PaymentService.deletePromo(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminPlanKeys.promos }),
    })
}

// useSaveReceiptIssuer saves the legal information of the receipts; the receipts read it again.
export function useSaveReceiptIssuer() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: ReceiptIssuerInput) => (await PaymentService.updateReceiptIssuer(input)).data,
        onSuccess: (issuer) => qc.setQueryData<ReceiptIssuer>(billingKeys.issuer, issuer),
    })
}
