import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AccountService from '@/services/AccountService'
import type { AdminUser, UserQuery } from '@/types/user'

export const adminUserKeys = {
    all: ['admin', 'users'] as const,
    list: (query: UserQuery) => ['admin', 'users', 'list', query] as const,
    one: (id: string) => ['admin', 'users', 'one', id] as const,
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
