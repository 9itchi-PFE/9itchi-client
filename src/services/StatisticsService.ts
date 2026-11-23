import { api } from './ApiService'

const StatisticsService = {
    overview: () => api('statistics').get(`/admin/statistics/overview`),
    registrations: () => api('statistics').get(`/admin/statistics/registrations`),
    emails: () => api('statistics').get(`/admin/statistics/emails`),
    subscriptions: () => api('statistics').get(`/admin/statistics/subscriptions`),
    revenue: () => api('statistics').get(`/admin/statistics/revenue`),
}

export default StatisticsService
