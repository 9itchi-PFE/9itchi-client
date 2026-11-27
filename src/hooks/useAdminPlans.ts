import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PaymentService from '@/services/PaymentService'
import type { FreeGrantInput, PlanInput, PromoInput, ReceiptIssuer, ReceiptIssuerInput, SaleInput, StudentDiscount } from '@/types/plan'
import { billingKeys } from './usePlans'

export const adminPlanKeys = {
    plans: ['admin', 'plans'] as const,
    promos: ['admin', 'promo-codes'] as const,
    sales: ['admin', 'sales'] as const,
    student: ['admin', 'student-discount'] as const,
    grants: ['admin', 'free-grants'] as const,
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

// useCreatePlan adds a paid plan; it joins the list and the table of limits.
export function useCreatePlan() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: PlanInput) => (await PaymentService.createPlan(input)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminPlanKeys.plans })
            qc.invalidateQueries({ queryKey: billingKeys.plans })
        },
    })
}

// useSwitchOffPlan stops proposing a plan to students; its subscribers keep what they paid for.
export function useSwitchOffPlan() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => PaymentService.deactivatePlan(id),
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

export function useSales() {
    return useQuery({ queryKey: adminPlanKeys.sales, queryFn: async () => (await PaymentService.listSales()).data.items })
}

// A sale changes the prices students see: they are read again with the list.
function useSalesChanged() {
    const qc = useQueryClient()
    return () => {
        qc.invalidateQueries({ queryKey: adminPlanKeys.sales })
        qc.invalidateQueries({ queryKey: billingKeys.plans })
    }
}

export function useSaveSale() {
    const changed = useSalesChanged()
    return useMutation({
        mutationFn: async ({ id, input }: { id?: string; input: SaleInput }) =>
            (await (id ? PaymentService.updateSale(id, input) : PaymentService.createSale(input))).data,
        onSuccess: changed,
    })
}

export function useDeleteSale() {
    const changed = useSalesChanged()
    return useMutation({ mutationFn: (id: string) => PaymentService.deleteSale(id), onSuccess: changed })
}

// useSaveReceiptIssuer saves the legal information of the receipts; the receipts read it again.
export function useSaveReceiptIssuer() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: ReceiptIssuerInput) => (await PaymentService.updateReceiptIssuer(input)).data,
        onSuccess: (issuer) => qc.setQueryData<ReceiptIssuer>(billingKeys.issuer, issuer),
    })
}

// useStudentDiscount reads the student discount as the admin set it; useSaveStudentDiscount replaces it.
export function useStudentDiscount() {
    return useQuery({ queryKey: adminPlanKeys.student, queryFn: async () => (await PaymentService.studentDiscount()).data })
}

export function useSaveStudentDiscount() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: StudentDiscount) => (await PaymentService.updateStudentDiscount(input)).data,
        onSuccess: (saved) => {
            qc.setQueryData<StudentDiscount>(adminPlanKeys.student, saved)
            qc.invalidateQueries({ queryKey: billingKeys.student })
        },
    })
}

// useFreeGrants lists the emails the team gave free usage to, newest first.
export function useFreeGrants() {
    return useQuery({
        queryKey: adminPlanKeys.grants,
        queryFn: async () => {
            const { data } = await PaymentService.listFreeGrants()
            // Anything but a list (an older payments-api, a mock) is read as no grant rather than breaking the Plans screen.
            return Array.isArray(data) ? data : []
        },
    })
}

export function useGiveFreeGrants() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: FreeGrantInput) => (await PaymentService.giveFreeGrants(input)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: adminPlanKeys.grants }),
    })
}

export function useSaveFreeGrant() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ email, quotas, note }: { email: string; quotas: Record<string, number>; note: string }) =>
            (await PaymentService.updateFreeGrant(email, { quotas, note })).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: adminPlanKeys.grants }),
    })
}

export function useDeleteFreeGrant() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (email: string) => PaymentService.deleteFreeGrant(email),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminPlanKeys.grants }),
    })
}
