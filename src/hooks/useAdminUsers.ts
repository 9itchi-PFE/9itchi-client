import { useQuery } from '@tanstack/react-query'
import AccountService from '@/services/AccountService'

export function useAdminUsers() {
    return useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => (await AccountService.listUsers()).data,
    })
}
