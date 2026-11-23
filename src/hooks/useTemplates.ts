import { useQuery } from '@tanstack/react-query'
import ResumeService from '@/services/ResumeService'

export function useTemplates() {
    return useQuery({
        queryKey: ['templates'],
        queryFn: async () => (await ResumeService.listTemplates()).data,
    })
}
