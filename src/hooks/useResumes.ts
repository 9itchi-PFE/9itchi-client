import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ResumeService from '@/services/ResumeService'
import { allSkills } from '@/components/resume/cvText'
import { normalize, type Resume } from '@/types/resume'
import { resumeSlots } from '@/utils/resumeSlots'
import { useMySubscription } from './usePlans'

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

// useResumeSlots: how many CVs the student has against what the plan allows (limit null: unlimited).
export function useResumeSlots() {
    const total = useResumes().data?.total ?? 0
    const sub = useMySubscription().data
    return resumeSlots(total, sub?.plan?.quotas, !!sub?.is_free)
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

// useCvSkills is the skills of one CV, as the offers are ranked by them.
export function useCvSkills(id: string) {
    const resume = useResume(id)
    const content = resume.data ? normalize(resume.data.content) : undefined
    return { ready: !id || resume.isFetched, skills: content ? allSkills(content) : [] }
}

// useMyCv is the student's most recent CV as the offers screens use it: its skills, and how many checks it still fails.
export function useMyCv() {
    const list = useResumes()
    const latest = [...(list.data?.items ?? [])].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
    const resume = useResume(latest?.id ?? '')
    const check = useAtsCheck(latest?.id ?? '')
    const content = resume.data ? normalize(resume.data.content) : undefined
    return {
        id: latest?.id,
        ready: list.isFetched && (!latest || resume.isFetched),
        skills: content ? allSkills(content) : [],
        toFix: check.data?.to_fix ?? 0,
    }
}

// useChooseEditable makes a read-only CV the one the student edits; every CV is read again (the list key is their prefix).
export function useChooseEditable() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => (await ResumeService.chooseEditable(id)).data,
        onSuccess: (data) => {
            qc.setQueryData(resumeKeys.one(data.id), data)
            qc.invalidateQueries({ queryKey: resumeKeys.list })
        },
    })
}
