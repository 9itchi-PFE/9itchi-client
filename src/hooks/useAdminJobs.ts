import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import JobService from '@/services/JobService'
import type { JobEdit, PostImport, ReviewJob, ReviewTab, SourceInput } from '@/types/job'

export const adminKeys = {
    sources: ['admin', 'sources'] as const,
    review: (tab: ReviewTab) => ['admin', 'review', tab] as const,
    reviewAll: ['admin', 'review'] as const,
    job: (id: string) => ['admin', 'job', id] as const,
}

// useSources lists the sources with the KPIs; while one runs, it asks again every 3 seconds.
export function useSources() {
    return useQuery({
        queryKey: adminKeys.sources,
        queryFn: async () => (await JobService.listSources()).data,
        refetchInterval: (q) => (q.state.data?.items.some((s) => s.state === 'running') ? 3000 : false),
    })
}

export function useSaveSource() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id?: string; input: SourceInput }) => (id ? JobService.updateSource(id, input) : JobService.createSource(input)),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.sources }),
    })
}

export function useDeleteSource() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => JobService.deleteSource(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.sources }),
    })
}

export function useRunSource() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => JobService.runSource(id),
        onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.sources }),
    })
}

export function useReviewList(tab: ReviewTab) {
    return useQuery({ queryKey: adminKeys.review(tab), queryFn: async () => (await JobService.listReview(tab)).data })
}

export function useReviewJob(id: string | undefined) {
    return useQuery({ queryKey: adminKeys.job(id ?? ''), queryFn: async () => (await JobService.getReview(id!)).data, enabled: !!id })
}

// settle stores the offer as job-api returned it and refreshes the queues, the KPIs and what students see.
function settle(qc: QueryClient, j: ReviewJob) {
    qc.setQueryData(adminKeys.job(j.id), j)
    qc.invalidateQueries({ queryKey: adminKeys.reviewAll })
    qc.invalidateQueries({ queryKey: adminKeys.sources })
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['books'] })
}

export function useReviewAction() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, action }: { id: string; action: 'publish' | 'hide' }) =>
            (await (action === 'publish' ? JobService.publishJob(id) : JobService.hideJob(id))).data,
        onSuccess: (j) => settle(qc, j),
    })
}

export function useEditReview() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, edit }: { id: string; edit: JobEdit }) => (await JobService.editReview(id, edit)).data,
        onSuccess: (j) => settle(qc, j),
    })
}

export function useImportPost() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (p: PostImport) => (await JobService.importPost(p)).data,
        onSuccess: (j) => settle(qc, j),
    })
}
