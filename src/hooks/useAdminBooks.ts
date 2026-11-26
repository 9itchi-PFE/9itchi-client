import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
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

// useBookPdf gives an address for the PDF 9itchi keeps: it is read with the session, then held in memory for as
// long as the page shows it. url is undefined while it loads or when there is none; loaded counts the bytes received
// so far, and retry reads it again after a failure (no silent second attempt: the first one can take a minute).
export function useBookPdf(id: string | undefined, enabled: boolean, admin = false) {
    const [loaded, setLoaded] = useState(0)
    const file = useQuery({
        queryKey: ['books', 'pdf', id ?? '', admin],
        queryFn: async () => {
            setLoaded(0)
            return (await JobService.bookPdf(id!, admin, setLoaded)).data
        },
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
    return { url, isLoading: file.isLoading, isError: file.isError, loaded, retry: () => file.refetch() }
}
