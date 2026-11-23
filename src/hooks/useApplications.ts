import { useQuery } from '@tanstack/react-query'
import EmailService from '@/services/EmailService'

export function useApplications() {
    return useQuery({
        queryKey: ['applications'],
        queryFn: async () => (await EmailService.listApplications()).data,
    })
}
