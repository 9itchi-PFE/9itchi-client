import { errorStatus } from '@/services/ApiService'
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import JobService from '@/services/JobService'
import type { Book, Job, JobList, JobQuery } from '@/types/job'

export const jobKeys = {
    all: ['jobs'] as const,
    list: (q: JobQuery) => ['jobs', 'list', q] as const,
    // total is the count of a query alone (tab badges, empty search suggestions).
    total: (q: JobQuery) => ['jobs', 'total', q] as const,
    counts: ['jobs', 'counts'] as const,
    one: (id: string) => ['jobs', 'one', id] as const,
    similar: (id: string) => ['jobs', 'similar', id] as const,
    books: (page: number) => ['books', page] as const,
    book: (id: string) => ['books', 'one', id] as const,
}

export function useJobList(q: JobQuery, enabled = true) {
    return useQuery({
        queryKey: jobKeys.list(q),
        queryFn: async () => (await JobService.listJobs(q)).data,
        placeholderData: keepPreviousData,
        enabled,
    })
}

export function useJobCounts() {
    return useQuery({ queryKey: jobKeys.counts, queryFn: async () => (await JobService.counts()).data })
}

export function useJob(id: string | undefined) {
    return useQuery({ queryKey: jobKeys.one(id ?? ''), queryFn: async () => (await JobService.getJob(id!)).data, enabled: !!id })
}

// usePublicJob reads an offer for someone with no account (a link that was shared).
export function usePublicJob(id: string) {
    return useQuery({
        queryKey: [...jobKeys.all, 'public', id],
        queryFn: async () => (await JobService.publicJob(id)).data,
        retry: (count, err) => errorStatus(err) !== 404 && count < 2,
    })
}

export function useSimilarJobs(id: string, enabled: boolean) {
    return useQuery({ queryKey: jobKeys.similar(id), queryFn: async () => (await JobService.similarJobs(id)).data, enabled })
}

export function useBooks(page = 1) {
    return useQuery({ queryKey: jobKeys.books(page), queryFn: async () => (await JobService.listBooks(page)).data })
}

export function useBook(id: string) {
    return useQuery({ queryKey: jobKeys.book(id), queryFn: async () => (await JobService.getBook(id)).data, enabled: !!id })
}

// markSaved flips the saved flag of one offer in every cached list, offer and book, so the bookmark answers at once.
function markSaved(qc: QueryClient, id: string, saved: boolean) {
    qc.setQueriesData<JobList>({ queryKey: ['jobs', 'list'] }, (d) => (d?.items ? { ...d, items: d.items.map((j) => (j.id === id ? { ...j, saved } : j)) } : d))
    qc.setQueryData<Job>(jobKeys.one(id), (d) => (d ? { ...d, saved } : d))
    qc.setQueriesData<Book>({ queryKey: ['books', 'one'] }, (d) => (d?.jobs ? { ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, saved } : j)) } : d))
}

// useToggleSave keeps or forgets an offer; on failure the bookmark goes back.
export function useToggleSave() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, saved }: { id: string; saved: boolean }) => (saved ? JobService.saveJob(id) : JobService.unsaveJob(id)),
        onMutate: ({ id, saved }) => markSaved(qc, id, saved),
        onError: (_e, { id, saved }) => markSaved(qc, id, !saved),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: jobKeys.counts })
            qc.invalidateQueries({ queryKey: ['jobs', 'list', { tab: 'saved' }] })
            qc.invalidateQueries({ queryKey: ['jobs', 'total', { tab: 'saved' }] })
        },
    })
}
