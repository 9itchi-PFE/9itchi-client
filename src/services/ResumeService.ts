import { api } from './ApiService'

const ResumeService = {
    uploadResume: (data?: unknown) => api('resume').post(`/resumes/upload`, data),
    createResume: (data?: unknown) => api('resume').post(`/resumes`, data),
    listResumes: () => api('resume').get(`/resumes`),
    getResume: (id: string) => api('resume').get(`/resumes/${id}`),
    updateResume: (id: string, data?: unknown) => api('resume').put(`/resumes/${id}`, data),
    deleteResume: (id: string) => api('resume').delete(`/resumes/${id}`),
    listVersions: (id: string) => api('resume').get(`/resumes/${id}/versions`),
    createVersion: (id: string, data?: unknown) => api('resume').post(`/resumes/${id}/versions`, data),
    exportResume: (id: string, data?: unknown) => api('resume').post(`/resumes/${id}/export`, data),
    aTSCheck: (id: string, data?: unknown) => api('resume').post(`/resumes/${id}/ats-check`, data),
    listTemplates: () => api('resume').get(`/templates`),
    getTemplate: (id: string) => api('resume').get(`/templates/${id}`),
    createTemplate: (data?: unknown) => api('resume').post(`/admin/templates`, data),
    updateTemplate: (id: string, data?: unknown) => api('resume').put(`/admin/templates/${id}`, data),
}

export default ResumeService
