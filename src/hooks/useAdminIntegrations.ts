import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import StatisticsService from '@/services/StatisticsService'
import type { IntegrationUpdate } from '@/types/statistics'

const key = ['admin', 'integrations'] as const

// useIntegrations reads the monthly consumption and quota of every AI provider and plugin.
export function useIntegrations() {
    return useQuery({ queryKey: key, queryFn: async () => (await StatisticsService.integrations()).data, refetchInterval: 60_000 })
}

// useUpdateIntegration changes a quota and/or replaces an API token, then reads the figures again.
export function useUpdateIntegration() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ provider, input }: { provider: string; input: IntegrationUpdate }) =>
            (await StatisticsService.updateIntegration(provider, input)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    })
}
