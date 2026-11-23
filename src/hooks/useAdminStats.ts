import { useQuery } from '@tanstack/react-query'
import StatisticsService from '@/services/StatisticsService'

export function useAdminStats() {
    return useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => (await StatisticsService.overview()).data,
    })
}
