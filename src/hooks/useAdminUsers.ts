import { isAxiosError } from 'axios'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AccountService from '@/services/AccountService'
import EmailService from '@/services/EmailService'
import PaymentService from '@/services/PaymentService'
import ResumeService from '@/services/ResumeService'
import type { AdminUser, UserNote, UserQuery } from '@/types/user'

export const adminUserKeys = {
    all: ['admin', 'users'] as const,
    list: (query: UserQuery) => ['admin', 'users', 'list', query] as const,
    one: (id: string) => ['admin', 'users', 'one', id] as const,
    part: (id: string, what: 'subscription' | 'payments' | 'applications' | 'gmail' | 'cv' | 'note' | 'gifts' | 'downloads' | 'sent-with-cv') =>
        ['admin', 'users', 'one', id, what] as const,
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

// useStudentDownloads and useStudentBuiltSends say when the student last used what a subscription pays for: the
// payments table needs both to tell whether a recent payment can still be refunded.
export function useStudentDownloads(id: string) {
    return useQuery({
        queryKey: adminUserKeys.part(id, 'downloads'),
        queryFn: async () => (await ResumeService.userDownloads(id)).data,
        enabled: !!id,
        retry: 1,
    })
}

export function useStudentBuiltSends(id: string) {
    return useQuery({
        queryKey: adminUserKeys.part(id, 'sent-with-cv'),
        queryFn: async () => (await EmailService.userBuiltSends(id)).data,
        enabled: !!id,
        retry: 1,
    })
}

// useStudentCV reads where the student's CV stands; a student without a CV is not an error (null).
export function useStudentCV(id: string) {
    return useQuery({
        queryKey: adminUserKeys.part(id, 'cv'),
        queryFn: async () => {
            try {
                return (await ResumeService.userCV(id)).data
            } catch (e) {
                if (isAxiosError(e) && e.response?.status === 404) return null
                throw e
            }
        },
        enabled: !!id,
        retry: 1,
    })
}

export function useStudentNote(id: string) {
    return useQuery({ queryKey: adminUserKeys.part(id, 'note'), queryFn: async () => (await AccountService.getUserNote(id)).data, enabled: !!id, retry: 1 })
}

export function useSaveStudentNote(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (note: string) => (await AccountService.setUserNote(id, note)).data,
        onSuccess: (saved) => qc.setQueryData<UserNote>(adminUserKeys.part(id, 'note'), saved),
    })
}

export function useStudentGifts(id: string) {
    return useQuery({
        queryKey: adminUserKeys.part(id, 'gifts'),
        queryFn: async () => (await PaymentService.userGifts(id)).data.items,
        enabled: !!id,
        retry: 1,
    })
}

// useGiveMonth gives the student 30 days; the plan and the gifts of the file are read again.
export function useGiveMonth(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async () => (await PaymentService.giveMonth(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminUserKeys.part(id, 'subscription') })
            qc.invalidateQueries({ queryKey: adminUserKeys.part(id, 'gifts') })
        },
    })
}
