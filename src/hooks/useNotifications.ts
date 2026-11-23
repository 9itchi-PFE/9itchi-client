import { useQuery } from '@tanstack/react-query'
import NotificationService from '@/services/NotificationService'

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => (await NotificationService.listNotifications()).data,
    })
}
