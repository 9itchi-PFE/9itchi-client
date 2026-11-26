import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import EmailService from '@/services/EmailService'
import TrackerService from '@/services/TrackerService'
import { isAxiosError } from 'axios'
import { today } from '@/components/admin/plans'
import { loadScores } from '@/components/jobs/scores'
import type { Application, ApplicationList, ApplyInput, DraftInput, JobMatch, MatchInput } from '@/types/application'

export const applicationKeys = {
    list: ['applications'] as const,
    // Under the list key: an application sent or cancelled reads it again with the list.
    allowance: ['applications', 'allowance'] as const,
    match: (input: MatchInput) => ['applications', 'match', input.job_id, input.resume_id, input.language] as const,
    gmail: ['gmail'] as const,
    email: (id: string) => ['emails', id] as const,
    opens: (id: string) => ['emails', id, 'opens'] as const,
    // One AI batch per CV and per day in Tunis: the key changes at midnight and the next visit asks again.
    scores: (resumeId: string, day: string) => ['scores', resumeId, day] as const,
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

// useScores gives the AI's quick scores of the first offers of « Pour toi »: the ones already made, then the AI
// scores the first ones without (counted per day by the plan). Read once a day; the list shows without waiting.
export function useScores(resumeId: string | undefined, jobIds: string[], language: MatchInput['language'], enabled: boolean) {
    return useQuery({
        queryKey: applicationKeys.scores(resumeId ?? '', today()),
        queryFn: () => loadScores({ resume_id: resumeId!, language, job_ids: jobIds }, { cached: EmailService.cachedScores, score: EmailService.scores }),
        enabled: enabled && !!resumeId && jobIds.length > 0,
        staleTime: Infinity,
        gcTime: 24 * 60 * 60_000,
        retry: false,
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
