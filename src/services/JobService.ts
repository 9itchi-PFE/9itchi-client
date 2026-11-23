import { api } from './ApiService'

const JobService = {
    listJobs: () => api('job').get(`/jobs`),
    recommendedJobs: () => api('job').get(`/jobs/recommended`),
    getJob: (id: string) => api('job').get(`/jobs/${id}`),
}

export default JobService
