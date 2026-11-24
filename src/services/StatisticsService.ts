import type { Dashboard } from '@/types/statistics'
import { api } from './ApiService'

type Range = { from: string; to: string }

const StatisticsService = {
    // overview returns every metric, day by day, between two days (YYYY-MM-DD, 366 days at most).
    overview: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/overview`, { params }),
    registrations: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/registrations`, { params }),
    emails: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/emails`, { params }),
    subscriptions: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/subscriptions`, { params }),
    revenue: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/revenue`, { params }),
}

export default StatisticsService
