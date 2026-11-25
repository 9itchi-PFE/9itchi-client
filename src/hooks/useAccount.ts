import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AccountService from '@/services/AccountService'
import type { Me, MeInput } from '@/types/user'

export const accountKeys = { me: ['account', 'me'] as const }

// useMe reads the student's own account (name, email, school).
export function useMe() {
    return useQuery({ queryKey: accountKeys.me, queryFn: async () => (await AccountService.getMe()).data })
}

export function useUpdateMe() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: MeInput) => (await AccountService.updateMe(input)).data,
        onSuccess: (me) => qc.setQueryData<Me>(accountKeys.me, me),
    })
}

// useDeleteMe deletes the account and everything 9itchi keeps about its owner. account-api answers 502 when one
// of the services could not erase its part: nothing is lost, the student can ask again.
export function useDeleteMe() {
    return useMutation({ mutationFn: async () => (await AccountService.deleteMe()).data })
}
