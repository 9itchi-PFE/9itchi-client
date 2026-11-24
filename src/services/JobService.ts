import type { Book, BookList, Job, JobCounts, JobList, JobQuery } from '@/types/job'
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
    recommendedJobs: () => api('job').get(`/jobs/recommended`),
    getJob: (id: string) => api('job').get<Job>(`/jobs/${id}`),
    similarJobs: (id: string, limit = 3) => api('job').get<JobList>(`/jobs/${id}/similar`, { params: { limit } }),
    saveJob: (id: string) => api('job').put(`/jobs/${id}/save`),
    unsaveJob: (id: string) => api('job').delete(`/jobs/${id}/save`),
    listBooks: (page = 1, pageSize = 12) => api('job').get<BookList>(`/books`, { params: { page, page_size: pageSize } }),
    getBook: (id: string) => api('job').get<Book>(`/books/${id}`),
    getPreferences: () => api('job').get<SavedPreferences>(`/preferences`),
    savePreferences: (p: Preferences) => api('job').put<SavedPreferences>(`/preferences`, p),
    previewPreferences: (p: Preferences) => api('job').post<{ count: number; unanswered: number }>(`/preferences/preview`, p),
}

export default JobService
