import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { autoPublishPoll, runFinished } from '@/components/admin/books'
import JobService from '@/services/JobService'
import type { AdminBook, BookEdit } from '@/types/job'
import { adminKeys } from './useAdminJobs'

// useAdminBooks lists every book; while one is being read, it asks again every 3 seconds.
export function useAdminBooks() {
    return useQuery({
        queryKey: adminKeys.books,
        queryFn: async () => (await JobService.listAdminBooks()).data.items,
        refetchInterval: (q) => (q.state.data?.some((b) => b.status === 'importing') ? 3000 : false),
    })
}

// useAdminBook is one book with its topics; it asks again every 3 seconds until its PDF is read.
export function useAdminBook(id: string) {
    return useQuery({
        queryKey: adminKeys.book(id),
        queryFn: async () => (await JobService.getAdminBook(id)).data,
        enabled: !!id,
        refetchInterval: (q) => (q.state.data?.status === 'importing' ? 3000 : false),
    })
}

// settle stores the book as job-api returned it and refreshes the list, the offers queue and what students see.
function settle(qc: QueryClient, b: AdminBook) {
    qc.setQueryData(adminKeys.book(b.id), b)
    qc.invalidateQueries({ queryKey: adminKeys.books, exact: true })
    qc.invalidateQueries({ queryKey: adminKeys.reviewAll })
    qc.invalidateQueries({ queryKey: adminKeys.sources })
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['books'] })
}

export function useImportBook() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ file, company }: { file: File; company: string }) => (await JobService.importBook(file, company)).data,
        onSuccess: (b) => settle(qc, b),
    })
}

export function useEditBook(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (edit: BookEdit) => (await JobService.editBook(id, edit)).data,
        onSuccess: (b) => settle(qc, b),
    })
}

export function usePublishBook(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (jobIds: string[]) => (await JobService.publishBook(id, jobIds)).data,
        onSuccess: (b) => settle(qc, b),
    })
}

export function useRetryBook(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async () => (await JobService.retryBook(id)).data,
        onSuccess: (b) => settle(qc, b),
    })
}

export function useDeleteBook() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => JobService.deleteBook(id),
        onSuccess: (_r, id) => {
            qc.removeQueries({ queryKey: adminKeys.book(id) })
            qc.invalidateQueries({ queryKey: adminKeys.books, exact: true })
            qc.invalidateQueries({ queryKey: adminKeys.reviewAll })
        },
    })
}

// useAutoPublish is the last automatic run; it asks again every 3 seconds while one runs, and when it ends the books,
// the offers queue and what students see are read again.
export function useAutoPublish() {
    const qc = useQueryClient()
    const run = useQuery({
        queryKey: adminKeys.autoPublish,
        queryFn: async () => (await JobService.getAutoPublish()).data,
        refetchInterval: (q) => autoPublishPoll(q.state.data),
        retry: false,
    })
    const was = useRef(run.data?.running)
    useEffect(() => {
        if (runFinished(was.current, run.data?.running)) {
            qc.invalidateQueries({ queryKey: adminKeys.books })
            qc.invalidateQueries({ queryKey: adminKeys.reviewAll })
            qc.invalidateQueries({ queryKey: ['jobs'] })
            qc.invalidateQueries({ queryKey: ['books'] })
        }
        was.current = run.data?.running
    }, [qc, run.data?.running])
    return run
}

export function useStartAutoPublish() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async () => (await JobService.startAutoPublish()).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.autoPublish }),
    })
}

// useBookPdf gives an address for the whole PDF 9itchi keeps (the admin's check screen shows it in a frame): it is read
// with the session, then held in memory for as long as the page shows it. undefined while it loads or when there is none.
export function useBookPdf(id: string | undefined, enabled: boolean, admin = false) {
    const file = useQuery({
        queryKey: ['books', 'pdf', id ?? '', admin],
        queryFn: async () => (await JobService.bookPdf(id!, admin)).data,
        enabled: !!id && enabled,
        staleTime: 5 * 60 * 1000,
        retry: false,
    })
    const [url, setUrl] = useState<string>()
    useEffect(() => {
        if (!file.data) {
            setUrl(undefined)
            return
        }
        const next = URL.createObjectURL(file.data)
        setUrl(next)
        return () => URL.revokeObjectURL(next)
    }, [file.data])
    return { url, isLoading: file.isLoading, isError: file.isError }
}
