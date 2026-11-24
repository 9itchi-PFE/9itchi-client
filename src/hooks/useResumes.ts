import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ResumeService from '@/services/ResumeService'
import type { Resume } from '@/types/resume'

export const resumeKeys = {
    list: ['resumes'] as const,
    one: (id: string) => ['resumes', id] as const,
    versions: (id: string) => ['resumes', id, 'versions'] as const,
    check: (id: string) => ['resumes', id, 'check'] as const,
    photo: (id: string) => ['resumes', id, 'photo'] as const,
    files: (id: string) => ['resumes', id, 'files'] as const,
    downloads: ['downloads'] as const,
}

export function useResumes() {
    return useQuery({ queryKey: resumeKeys.list, queryFn: async () => (await ResumeService.listResumes()).data })
}

// useResume polls while an uploaded CV is being read (parse_status pending).
export function useResume(id: string) {
    return useQuery({
        queryKey: resumeKeys.one(id),
        queryFn: async () => (await ResumeService.getResume(id)).data,
        refetchInterval: (q) => ((q.state.data as Resume | undefined)?.parse_status === 'pending' ? 1500 : false),
        enabled: !!id,
    })
}

export function useVersions(id: string, enabled = true) {
    return useQuery({ queryKey: resumeKeys.versions(id), queryFn: async () => (await ResumeService.listVersions(id)).data.items, enabled })
}

export function useAtsCheck(id: string) {
    return useQuery({
        queryKey: resumeKeys.check(id),
        queryFn: async () => (await ResumeService.aTSCheck(id)).data,
        enabled: !!id,
        placeholderData: (prev) => prev,
    })
}

// usePhoto returns an object URL for the CV photo, or null.
export function usePhoto(id: string, hasPhoto: boolean | undefined) {
    return useQuery({
        queryKey: [...resumeKeys.photo(id), hasPhoto],
        queryFn: async () => URL.createObjectURL((await ResumeService.getPhoto(id)).data),
        enabled: !!id && !!hasPhoto,
        staleTime: Infinity,
    })
}

export function useDownloads() {
    return useQuery({ queryKey: resumeKeys.downloads, queryFn: async () => (await ResumeService.downloads()).data })
}

export function useSaveVersion(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (label: string) => ResumeService.createVersion(id, label),
        onSuccess: () => qc.invalidateQueries({ queryKey: resumeKeys.versions(id) }),
    })
}
