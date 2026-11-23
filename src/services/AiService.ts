import { api } from './ApiService'

const AiService = {
    rewriteSection: (data?: unknown) => api('ai').post(`/ai/resume/rewrite`, data),
    draftEmail: (data?: unknown) => api('ai').post(`/ai/emails/draft`, data),
}

export default AiService
