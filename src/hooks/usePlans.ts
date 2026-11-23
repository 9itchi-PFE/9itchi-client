import { useQuery } from '@tanstack/react-query'
import PaymentService from '@/services/PaymentService'

export function usePlans() {
    return useQuery({
        queryKey: ['plans'],
        queryFn: async () => (await PaymentService.listPlans()).data,
    })
}
