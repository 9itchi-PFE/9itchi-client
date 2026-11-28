import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AccountService from '@/services/AccountService'
import type { SchoolInput, SchoolNames } from '@/types/school'

export const schoolKeys = { all: ['account', 'schools'] as const }

// useSchools reads the list of schools students choose from. It is public (the sign-up screen needs it), and it
// changes rarely: a list read a few minutes ago is good enough.
export function useSchools() {
    return useQuery({
        queryKey: schoolKeys.all,
        queryFn: async () => (await AccountService.listSchools()).data.items,
        staleTime: 5 * 60 * 1000,
    })
}

// The three below are the team's: each one reads the list again.
export function useCreateSchool() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: SchoolInput) => (await AccountService.createSchool(input)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.all }),
    })
}

export function useUpdateSchool() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ code, names }: { code: string; names: SchoolNames }) => (await AccountService.updateSchool(code, names)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.all }),
    })
}

export function useDeleteSchool() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (code: string) => AccountService.deleteSchool(code),
        onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.all }),
    })
}
