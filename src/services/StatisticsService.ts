import type { Dashboard, Integration, IntegrationUpdate, Integrations } from '@/types/statistics'
import { api } from './ApiService'

type Range = { from: string; to: string }

const StatisticsService = {
    // overview returns every metric, day by day, between two days (YYYY-MM-DD, 366 days at most).
    overview: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/overview`, { params }),
    registrations: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/registrations`, { params }),
    emails: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/emails`, { params }),
    subscriptions: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/subscriptions`, { params }),
    revenue: (params?: Range) => api('statistics').get<Dashboard>(`/admin/statistics/revenue`, { params }),
    integrations: () => api('statistics').get<Integrations>(`/admin/integrations`),
    updateIntegration: (provider: string, data: IntegrationUpdate) => api('statistics').put<Integration>(`/admin/integrations/${provider}`, data),
}

export default StatisticsService
