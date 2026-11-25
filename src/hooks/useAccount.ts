import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AccountService from '@/services/AccountService'
import type { Me, MeInput } from '@/types/user'

export const accountKeys = { me: ['account', 'me'] as const, photo: ['account', 'photo'] as const }

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

// useProfilePhoto returns an object URL for the profile photo, or nothing when there is none.
export function useProfilePhoto(hasPhoto: boolean | undefined) {
    return useQuery({
        queryKey: [...accountKeys.photo, hasPhoto],
        queryFn: async () => URL.createObjectURL((await AccountService.getPhoto()).data),
        enabled: !!hasPhoto,
        staleTime: Infinity,
    })
}

// useSetProfilePhoto sends a new profile photo (a file) or removes it (null).
export function useSetProfilePhoto() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (file: Blob | null) => (await (file ? AccountService.uploadPhoto(file) : AccountService.deletePhoto())).data,
        onSuccess: ({ has_photo }) => {
            qc.setQueryData<Me>(accountKeys.me, (me) => (me ? { ...me, has_photo } : me))
            qc.invalidateQueries({ queryKey: accountKeys.photo })
        },
    })
}
