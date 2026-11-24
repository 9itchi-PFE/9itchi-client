import { api } from './ApiService'

const AiService = {
    rewriteSection: (data: { section: 'bullet' | 'summary'; text: string; language?: 'fr' | 'en' | 'ar'; job_title?: string }) =>
        api('ai').post<{ suggestions: string[] }>(`/ai/resume/rewrite`, data),
    draftEmail: (data?: unknown) => api('ai').post(`/ai/emails/draft`, data),
}

export default AiService
