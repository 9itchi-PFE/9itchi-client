import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import EmailService from '@/services/EmailService'
import type { LetterLanguage } from '@/types/application'
import type { EmailEdit, OutgoingEmail } from '@/types/recruiter'

// useAttachmentNames reads the CV and cover-letter file names for a CV ('' : none) and a letter language.
export function useAttachmentNames(resumeId: string, language: LetterLanguage) {
    return useQuery({
        queryKey: ['attachment-names', resumeId, language],
        queryFn: async () => (await EmailService.attachmentNames(resumeId, language)).data,
        staleTime: 5 * 60_000,
    })
}

export function useEmails() {
    return useQuery({
        queryKey: ['emails'],
        queryFn: async () => (await EmailService.listEmails()).data,
    })
}

// useSendEmail sends now, or at scheduled_at when it is given.
export function useSendEmail() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: OutgoingEmail) => (input.scheduled_at ? EmailService.scheduleEmail(input) : EmailService.sendEmail(input)),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['emails'] }),
    })
}

export function useUpdateEmail() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, edit }: { id: string; edit: EmailEdit }) => (await EmailService.updateEmail(id, edit)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['emails'] }),
    })
}

export function useCancelEmail() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => EmailService.cancelEmail(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['emails'] }),
    })
}
