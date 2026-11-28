import type { AdminTemplate, ATSCheck, Downloads, Resume, ResumeContent, ResumeFile, ResumeList, Template, Version, VersionWithContent } from '@/types/resume'
import { api } from './ApiService'
import type { LastUse, ResumeUsage, UserCV } from '@/types/user'

const r = () => api('resume')

const ResumeService = {
    uploadResume: (file: File) => {
        const form = new FormData()
        form.append('file', file)
        return r().post<{ resume: Resume; file: ResumeFile }>(`/resumes/upload`, form)
    },
    createResume: (data: { title: string; template_id?: string; content?: Partial<ResumeContent> }) => r().post<Resume>(`/resumes`, data),
    listResumes: () => r().get<ResumeList>(`/resumes`, { params: { page_size: 100 } }),
    getResume: (id: string) => r().get<Resume>(`/resumes/${id}`),
    // userCV is where a student's CV stands with the 24 rules, for the team (admin). 404: no CV.
    // userDownloads is how many CV downloads a student made and when the last one was (admin).
    userDownloads: (userId: string) => r().get<LastUse>(`/admin/users/${userId}/downloads`),
    // userUsage is how much of the plan a student used here: CVs, downloads, AI rewrites (admin).
    userUsage: (userId: string) => r().get<ResumeUsage>(`/admin/users/${userId}/usage`),
    // rewrite asks the AI for a better version of one line (or the summary) of the student's CV, within the plan.
    rewrite: (id: string, data: { section: 'bullet' | 'summary'; text: string; language: 'fr' | 'en' | 'ar'; job_title?: string; goal?: 'quantify' }) =>
        r().post<{ suggestions: string[]; warnings?: string[]; limit: number | null; used: number }>(`/resumes/${id}/rewrite`, data),
    userCV: (userId: string) => r().get<UserCV>(`/admin/users/${userId}/cv`),
    // chooseEditable keeps this CV editable beyond the plan's CV limit; the others become read-only.
    chooseEditable: (id: string) => r().put<Resume>(`/resumes/${id}/editable`),
    updateResume: (id: string, data: { title?: string; template_id?: string; content?: ResumeContent }) => r().put<Resume>(`/resumes/${id}`, data),
    deleteResume: (id: string) => r().delete(`/resumes/${id}`),
    duplicateResume: (id: string, title: string) => r().post<Resume>(`/resumes/${id}/duplicate`, { title }),
    listVersions: (id: string) => r().get<{ items: Version[] }>(`/resumes/${id}/versions`),
    createVersion: (id: string, label: string) => r().post<Version>(`/resumes/${id}/versions`, { label }),
    getVersion: (id: string, versionId: string) => r().get<VersionWithContent>(`/resumes/${id}/versions/${versionId}`),
    restoreVersion: (id: string, versionId: string) => r().post<Resume>(`/resumes/${id}/versions/${versionId}/restore`),
    uploadPhoto: (id: string, file: File) => {
        const form = new FormData()
        form.append('file', file)
        return r().put(`/resumes/${id}/photo`, form)
    },
    getPhoto: (id: string) => r().get<Blob>(`/resumes/${id}/photo`, { responseType: 'blob' }),
    deletePhoto: (id: string) => r().delete(`/resumes/${id}/photo`),
    exportResume: (id: string, format: 'pdf' | 'docx') => r().post<ResumeFile>(`/resumes/${id}/export`, { format }),
    downloads: () => r().get<Downloads>(`/me/downloads`),
    aTSCheck: (id: string, targetLanguage?: string) =>
        r().post<ATSCheck>(`/resumes/${id}/ats-check`, targetLanguage ? { target_language: targetLanguage } : {}),
    listFiles: (id: string) => r().get<{ items: ResumeFile[] }>(`/resumes/${id}/files`),
    downloadFile: (id: string, fileId: string) => r().get<Blob>(`/resumes/${id}/files/${fileId}`, { responseType: 'blob' }),
    listTemplates: () => r().get<{ items: Template[] }>(`/templates`),
    getTemplate: (id: string) => r().get<Template>(`/templates/${id}`),
    // listAllTemplates is every template, published or not, with how many CVs use it (admin).
    listAllTemplates: () => r().get<{ items: AdminTemplate[] }>(`/admin/templates`),
    createTemplate: (data?: unknown) => r().post(`/admin/templates`, data),
    updateTemplate: (id: string, data: Partial<Pick<Template, 'name' | 'layout' | 'active'>>) => r().put<Template>(`/admin/templates/${id}`, data),
}

export default ResumeService
