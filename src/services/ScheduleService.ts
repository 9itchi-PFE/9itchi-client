import { api } from './ApiService'

const ScheduleService = {
    listTasks: () => api('schedule').get(`/admin/schedules`),
    runScraper: (source: string, data?: unknown) => api('schedule').post(`/admin/scrapers/${source}/run`, data),
}

export default ScheduleService
