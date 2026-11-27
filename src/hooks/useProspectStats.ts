import { useQuery } from '@tanstack/react-query'
import EmailService from '@/services/EmailService'

// useProspectStats reads the contact pool figures and the last 31 days of searches and provider credits.
export function useProspectStats() {
    return useQuery({ queryKey: ['admin', 'prospects', 'stats'], queryFn: async () => (await EmailService.getProspectStats()).data, refetchInterval: 60_000 })
}
