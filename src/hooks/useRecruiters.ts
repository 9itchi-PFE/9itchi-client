import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import EmailService from '@/services/EmailService'
import type { CompanyRecruiterInput, LinkDraftInput, RecruiterDraftInput, RecruiterSearchInput } from '@/types/recruiter'

export const recruiterKeys = {
    list: ['recruiters'] as const,
    // Under the list key: a search reads both again.
    allowance: ['recruiters', 'allowance'] as const,
}

export function useRecruiters() {
    return useQuery({ queryKey: recruiterKeys.list, queryFn: async () => (await EmailService.listRecruiters()).data.items ?? [] })
}

export function useRecruiterAllowance() {
    return useQuery({ queryKey: recruiterKeys.allowance, queryFn: async () => (await EmailService.recruiterAllowance()).data, retry: false })
}

// useSearchRecruiters runs a search; the found people join the list and the allowance is the one the search returned.
export function useSearchRecruiters() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: RecruiterSearchInput) => (await EmailService.searchRecruiters(input)).data,
        onSuccess: (r) => {
            qc.setQueryData(recruiterKeys.allowance, r.allowance)
            qc.invalidateQueries({ queryKey: recruiterKeys.list })
        },
        // A 402 can mean the day's searches ran out meanwhile.
        onError: () => qc.invalidateQueries({ queryKey: recruiterKeys.allowance }),
    })
}

// useCompanyRecruiters finds the people at one company; like a search, they join the list and the allowance updates.
export function useCompanyRecruiters() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: CompanyRecruiterInput) => (await EmailService.companyRecruiters(input)).data,
        onSuccess: (r) => {
            qc.setQueryData(recruiterKeys.allowance, r.allowance)
            qc.invalidateQueries({ queryKey: recruiterKeys.list })
        },
        onError: () => qc.invalidateQueries({ queryKey: recruiterKeys.allowance }),
    })
}

export function useRecruiterDraft() {
    return useMutation({
        mutationFn: async ({ id, input }: { id: string; input: RecruiterDraftInput }) => (await EmailService.draftForRecruiter(id, input)).data,
    })
}

export function useLinkDraft() {
    return useMutation({ mutationFn: async (input: LinkDraftInput) => (await EmailService.draftFromLink(input)).data })
}
