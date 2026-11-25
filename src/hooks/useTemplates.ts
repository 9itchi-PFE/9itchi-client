import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ResumeService from '@/services/ResumeService'

export const templateKeys = { list: ['templates'] as const, admin: ['admin', 'templates'] as const }

export function useTemplates() {
    return useQuery({
        queryKey: templateKeys.list,
        queryFn: async () => (await ResumeService.listTemplates()).data.items,
        staleTime: 5 * 60 * 1000,
    })
}

// useAdminTemplates lists every template for the team, withdrawn ones too, with how many CVs use each.
export function useAdminTemplates() {
    return useQuery({ queryKey: templateKeys.admin, queryFn: async () => (await ResumeService.listAllTemplates()).data.items })
}

// usePublishTemplate publishes a template or withdraws it; the team's list and the students' gallery are read again.
export function usePublishTemplate() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => (await ResumeService.updateTemplate(id, { active })).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateKeys.admin })
            qc.invalidateQueries({ queryKey: templateKeys.list })
        },
    })
}
