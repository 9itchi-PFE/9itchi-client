import { useQuery } from '@tanstack/react-query'
import ResumeService from '@/services/ResumeService'

export function useResumes() {
    return useQuery({
        queryKey: ['resumes'],
        queryFn: async () => (await ResumeService.listResumes()).data,
    })
}
