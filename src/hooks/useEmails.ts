import { useQuery } from '@tanstack/react-query'
import EmailService from '@/services/EmailService'

export function useEmails() {
    return useQuery({
        queryKey: ['emails'],
        queryFn: async () => (await EmailService.listEmails()).data,
    })
}
