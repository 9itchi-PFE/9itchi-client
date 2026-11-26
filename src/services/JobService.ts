import type { CompanyLogo } from '@/types/logo'
import type {
    AdminBook,
    Book,
    BookEdit,
    BookList,
    Job,
    JobCounts,
    JobEdit,
    JobList,
    JobQuery,
    PostImport,
    ReviewJob,
    ReviewList,
    ReviewTab,
    Source,
    SourceInput,
    SourceList,
    PublicJob,
} from '@/types/job'
import type { Preferences, SavedPreferences } from '@/types/preferences'
import { api } from './ApiService'

// toParams writes a query as job-api reads it: lists repeat the key (skill=C%2B%2B&skill=Linux), empty values are left out.
export function toParams(q: JobQuery): URLSearchParams {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(q)) {
        if (v === undefined || v === null || v === '' || v === false) continue
        if (Array.isArray(v)) v.forEach((x) => x && p.append(k, String(x)))
        else p.set(k, String(v))
    }
    return p
}

const JobService = {
    listJobs: (q: JobQuery = {}) => api('job').get<JobList>(`/jobs`, { params: toParams(q) }),
    counts: () => api('job').get<JobCounts>(`/jobs/counts`),
    recommendedJobs: () => api('job').get<JobList>(`/jobs/recommended`),
    // Company logos: the list anyone can read, the team's upload and removal. The image itself is logoUrl.
    logos: () => api('job').get<{ items: CompanyLogo[] }>(`/public/logos`),
    uploadLogo: (company: string, file: Blob) => {
        const form = new FormData()
        form.append('company', company)
        form.append('file', file)
        return api('job').put<CompanyLogo>(`/admin/logos`, form)
    },
    deleteLogo: (company: string) => api('job').delete(`/admin/logos`, { params: { company } }),
    // publicJob needs no account: the page of an offer shared by link.
    publicJob: (id: string) => api('job').get<PublicJob>(`/public/jobs/${id}`),
    getJob: (id: string) => api('job').get<Job>(`/jobs/${id}`),
    similarJobs: (id: string, limit = 3) => api('job').get<JobList>(`/jobs/${id}/similar`, { params: { limit } }),
    saveJob: (id: string) => api('job').put(`/jobs/${id}/save`),
    unsaveJob: (id: string) => api('job').delete(`/jobs/${id}/save`),
    listBooks: (page = 1, pageSize = 12) => api('job').get<BookList>(`/books`, { params: { page, page_size: pageSize } }),
    getBook: (id: string) => api('job').get<Book>(`/books/${id}`),
    getPreferences: () => api('job').get<SavedPreferences>(`/preferences`),
    savePreferences: (p: Preferences) => api('job').put<SavedPreferences>(`/preferences`, p),
    // Admin: collection sources (« Collectes ») and the review queue (« Offres »).
    listSources: () => api('job').get<SourceList>(`/admin/sources`),
    createSource: (s: SourceInput) => api('job').post<Source>(`/admin/sources`, s),
    updateSource: (id: string, s: SourceInput) => api('job').patch<Source>(`/admin/sources/${id}`, s),
    deleteSource: (id: string) => api('job').delete(`/admin/sources/${id}`),
    runSource: (id: string) => api('job').post<Source>(`/admin/sources/${id}/run`),
    listReview: (tab: ReviewTab, page = 1) => api('job').get<ReviewList>(`/admin/jobs`, { params: { tab, page, page_size: 50 } }),
    getReview: (id: string) => api('job').get<ReviewJob>(`/admin/jobs/${id}`),
    editReview: (id: string, e: JobEdit) => api('job').patch<ReviewJob>(`/admin/jobs/${id}`, e),
    publishJob: (id: string) => api('job').post<ReviewJob>(`/admin/jobs/${id}/publish`),
    hideJob: (id: string) => api('job').post<ReviewJob>(`/admin/jobs/${id}/hide`),
    importPost: (p: PostImport) => api('job').post<ReviewJob>(`/admin/jobs/import`, p),
    // Admin: PFE books imported from their PDF. bookPdf reads the PDF 9itchi keeps (the admin's copy for any book).
    listAdminBooks: () => api('job').get<{ items: AdminBook[] }>(`/admin/books`),
    getAdminBook: (id: string) => api('job').get<AdminBook>(`/admin/books/${id}`),
    importBook: (file: File, company: string) => {
        const form = new FormData()
        form.append('file', file)
        if (company) form.append('company', company)
        return api('job').post<AdminBook>(`/admin/books/import`, form)
    },
    editBook: (id: string, e: BookEdit) => api('job').patch<AdminBook>(`/admin/books/${id}`, e),
    publishBook: (id: string, jobIds: string[]) => api('job').post<AdminBook>(`/admin/books/${id}/publish`, { job_ids: jobIds }),
    retryBook: (id: string) => api('job').post<AdminBook>(`/admin/books/${id}/retry`),
    deleteBook: (id: string) => api('job').delete(`/admin/books/${id}`),
    // The PDF of a book can be several MB and the server sits behind a slow uplink, so it gets far longer than the usual 50 s.
    bookPdf: (id: string, admin = false, onProgress?: (bytes: number) => void) =>
        api('job').get<Blob>(`${admin ? '/admin' : ''}/books/${id}/pdf`, {
            responseType: 'blob',
            timeout: 5 * 60_000,
            onDownloadProgress: onProgress ? (e) => onProgress(e.loaded) : undefined,
        }),
    previewPreferences: (p: Preferences) => api('job').post<{ count: number; unanswered: number }>(`/preferences/preview`, p),
}

export default JobService
