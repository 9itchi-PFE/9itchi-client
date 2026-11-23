import { api } from './ApiService'

const EmailService = {
    connectGmail: () => api('email').get(`/gmail/connect`),
    gmailCallback: () => api('email').get(`/gmail/callback`),
    gmailStatus: () => api('email').get(`/gmail/status`),
    revokeGmail: () => api('email').delete(`/gmail/connection`),
    draftEmail: (data?: unknown) => api('email').post(`/emails/draft`, data),
    sendEmail: (data?: unknown) => api('email').post(`/emails`, data),
    scheduleEmail: (data?: unknown) => api('email').post(`/emails/schedule`, data),
    listEmails: () => api('email').get(`/emails`),
    getEmail: (id: string) => api('email').get(`/emails/${id}`),
    cancelEmail: (id: string) => api('email').delete(`/emails/${id}`),
    apply: (data?: unknown) => api('email').post(`/applications`, data),
    listApplications: () => api('email').get(`/applications`),
}

export default EmailService
