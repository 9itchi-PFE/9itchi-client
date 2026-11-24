import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AccountService from '@/services/AccountService'
import EmailService from '@/services/EmailService'
import PaymentService from '@/services/PaymentService'
import type { AdminUser, UserQuery } from '@/types/user'

export const adminUserKeys = {
    all: ['admin', 'users'] as const,
    list: (query: UserQuery) => ['admin', 'users', 'list', query] as const,
    one: (id: string) => ['admin', 'users', 'one', id] as const,
    part: (id: string, what: 'subscription' | 'payments' | 'applications' | 'gmail') => ['admin', 'users', 'one', id, what] as const,
}

// useAdminUsers lists the students; while a new page or search loads, the rows already shown stay.
export function useAdminUsers(query: UserQuery) {
    return useQuery({
        queryKey: adminUserKeys.list(query),
        queryFn: async () => (await AccountService.listUsers(query)).data,
        placeholderData: keepPreviousData,
    })
}

export function useAdminUser(id: string) {
    return useQuery({ queryKey: adminUserKeys.one(id), queryFn: async () => (await AccountService.getUser(id)).data, enabled: !!id })
}

// useSuspendUser suspends an account or lets it in again; the lists are read again.
export function useSuspendUser() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => (await AccountService.suspendUser(id, suspended)).data,
        onSuccess: (user) => {
            qc.setQueryData<AdminUser>(adminUserKeys.one(user.id), user)
            qc.invalidateQueries({ queryKey: adminUserKeys.all })
        },
    })
}

export function useDeleteUser() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => AccountService.deleteUser(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminUserKeys.all }),
    })
}

// The rest of a student's file comes from other services; each part is read on its own, so one service that is
// down leaves the others on the page. Nothing is retried in a loop: the page says what could not be read.
export function useStudentSubscription(id: string) {
    return useQuery({
        queryKey: adminUserKeys.part(id, 'subscription'),
        queryFn: async () => (await PaymentService.userSubscription(id)).data,
        enabled: !!id,
        retry: 1,
    })
}

export function useStudentPayments(id: string) {
    return useQuery({
        queryKey: adminUserKeys.part(id, 'payments'),
        queryFn: async () => (await PaymentService.userPayments(id)).data.items,
        enabled: !!id,
        retry: 1,
    })
}

export function useStudentApplications(id: string) {
    return useQuery({
        queryKey: adminUserKeys.part(id, 'applications'),
        queryFn: async () => (await EmailService.userApplications(id)).data.items,
        enabled: !!id,
        retry: 1,
    })
}

export function useStudentGmail(id: string) {
    return useQuery({ queryKey: adminUserKeys.part(id, 'gmail'), queryFn: async () => (await EmailService.userGmail(id)).data, enabled: !!id, retry: 1 })
}
