import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import EmailService from '@/services/EmailService'
import TrackerService from '@/services/TrackerService'
import { isAxiosError } from 'axios'
import type { Application, ApplicationList, ApplyInput, DraftInput, FollowUpDraftInput, JobMatch, MatchInput } from '@/types/application'

export const applicationKeys = {
    list: ['applications'] as const,
    // Under the list key: an application sent or cancelled reads it again with the list.
    allowance: ['applications', 'allowance'] as const,
    match: (input: MatchInput) => ['applications', 'match', input.job_id, input.resume_id, input.language] as const,
    gmail: ['gmail'] as const,
    email: (id: string) => ['emails', id] as const,
    opens: (id: string) => ['emails', id, 'opens'] as const,
}

export function useApplications() {
    return useQuery({ queryKey: applicationKeys.list, queryFn: async () => (await EmailService.listApplications()).data })
}

export function useAllowance() {
    return useQuery({ queryKey: applicationKeys.allowance, queryFn: async () => (await EmailService.allowance()).data })
}

// useMatch reads the AI's reading of the CV against the offer if it was already made: null when not, and the AI
// is never asked from here.
export function useMatch(input: MatchInput) {
    return useQuery({
        queryKey: applicationKeys.match(input),
        queryFn: async (): Promise<JobMatch | null> => {
            try {
                return (await EmailService.findMatch(input)).data
            } catch (e) {
                if (isAxiosError(e) && e.response?.status === 404) return null
                throw e
            }
        },
        enabled: !!input.job_id && !!input.resume_id,
        retry: false,
    })
}

// useRunMatch asks the AI; a reading already made comes back without being counted again.
export function useRunMatch() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: MatchInput) => (await EmailService.match(input)).data,
        onSuccess: (m, input) => qc.setQueryData(applicationKeys.match(input), m),
    })
}

export function useGmailStatus() {
    return useQuery({ queryKey: applicationKeys.gmail, queryFn: async () => (await EmailService.gmailStatus()).data })
}

export function useRevokeGmail() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async () => (await EmailService.revokeGmail()).data,
        onSuccess: (s) => qc.setQueryData(applicationKeys.gmail, s),
    })
}

export function useDraft() {
    return useMutation({ mutationFn: async (input: DraftInput) => (await EmailService.draftEmail(input)).data })
}

// put stores an application as email-api returned it, without waiting for the list to be read again.
function put(list: ApplicationList | undefined, a: Application): ApplicationList | undefined {
    if (!list) return list
    const rest = list.items.filter((x) => x.id !== a.id)
    return { items: [a, ...rest].sort((x, y) => y.created_at.localeCompare(x.created_at)) }
}

function useSettle() {
    const qc = useQueryClient()
    return (a: Application) => {
        qc.setQueryData<ApplicationList>(applicationKeys.list, (l) => put(l, a))
        qc.invalidateQueries({ queryKey: applicationKeys.list })
    }
}

export function useApply() {
    const settle = useSettle()
    return useMutation({ mutationFn: async (input: ApplyInput) => (await EmailService.apply(input)).data, onSuccess: settle })
}

export function useFollowUpDraft(id: string) {
    return useMutation({ mutationFn: async (input: FollowUpDraftInput) => (await EmailService.draftFollowUp(id, input)).data })
}

export function useFollowUp(id: string) {
    const settle = useSettle()
    return useMutation({
        mutationFn: async (data: { subject: string; body: string }) => (await EmailService.followUp(id, data)).data,
        onSuccess: settle,
    })
}

export function useUpdateApplication() {
    const settle = useSettle()
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'sent' | 'replied' | 'withdrawn' | 'closed' }) =>
            (await EmailService.updateApplication(id, status)).data,
        onSuccess: settle,
    })
}

export function useSendNow() {
    const settle = useSettle()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => (await EmailService.sendApplicationNow(id)).data,
        onSuccess: settle,
        // A failed send changes the application too (its email is now failed).
        onError: () => qc.invalidateQueries({ queryKey: applicationKeys.list }),
    })
}

// useEmail is the letter of an application, read when the student opens « Ta lettre ».
export function useEmail(id: string | null | undefined) {
    return useQuery({ queryKey: applicationKeys.email(id ?? ''), queryFn: async () => (await EmailService.getEmail(id!)).data, enabled: !!id })
}

// useOpens asks tracker-api when each sent email was first opened. An email with no tracking simply has no answer.
export function useOpens(emailIds: string[]): Record<string, string> {
    const results = useQueries({
        queries: emailIds.map((id) => ({
            queryKey: applicationKeys.opens(id),
            queryFn: async () => (await TrackerService.emailStats(id)).data.first_open_at,
            staleTime: 5 * 60_000,
            retry: false,
        })),
    })
    const out: Record<string, string> = {}
    results.forEach((r, i) => {
        if (r.data) out[emailIds[i]] = r.data
    })
    return out
}
