import type { Preferences, SavedPreferences } from '@/types/preferences'
import { api } from './ApiService'

const JobService = {
    listJobs: () => api('job').get(`/jobs`),
    recommendedJobs: () => api('job').get(`/jobs/recommended`),
    getJob: (id: string) => api('job').get(`/jobs/${id}`),
    getPreferences: () => api('job').get<SavedPreferences>(`/preferences`),
    savePreferences: (p: Preferences) => api('job').put<SavedPreferences>(`/preferences`, p),
    previewPreferences: (p: Preferences) => api('job').post<{ count: number; unanswered: number }>(`/preferences/preview`, p),
}

export default JobService
