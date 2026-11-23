import { useQuery } from '@tanstack/react-query'
import JobService from '@/services/JobService'

export function useJobs() {
    return useQuery({
        queryKey: ['jobs'],
        queryFn: async () => (await JobService.listJobs()).data,
    })
}
