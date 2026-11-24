import { keepPreviousData, useQuery } from '@tanstack/react-query'
import StatisticsService from '@/services/StatisticsService'

// useAdminStats reads every metric between two days; while another period loads, the figures already shown stay.
export function useAdminStats(range: { from: string; to: string }) {
    return useQuery({
        queryKey: ['admin', 'stats', range.from, range.to],
        queryFn: async () => (await StatisticsService.overview(range)).data,
        placeholderData: keepPreviousData,
    })
}
