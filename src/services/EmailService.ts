import type { Application, ApplicationList, ApplyInput, Draft, DraftInput, Email, GmailStatus } from '@/types/application'
import { api } from './ApiService'

const e = () => api('email')

const EmailService = {
    // connectGmail returns the Google consent page to send the browser to; Google comes back to /settings/gmail.
    connectGmail: () => e().get<{ url: string }>(`/gmail/connect`),
    gmailStatus: () => e().get<GmailStatus>(`/gmail/status`),
    revokeGmail: () => e().delete<GmailStatus>(`/gmail/connection`),
    // The AI can take a while to write: this call waits longer than the others.
    draftEmail: (data: DraftInput) => e().post<Draft>(`/emails/draft`, data, { timeout: 60_000 }),
    sendEmail: (data?: unknown) => e().post(`/emails`, data),
    scheduleEmail: (data?: unknown) => e().post(`/emails/schedule`, data),
    listEmails: () => e().get<Email[]>(`/emails`),
    getEmail: (id: string) => e().get<Email>(`/emails/${id}`),
    cancelEmail: (id: string) => e().delete(`/emails/${id}`),
    apply: (data: ApplyInput) => e().post<Application>(`/applications`, data),
    listApplications: () => e().get<ApplicationList>(`/applications`),
    // userApplications and userGmail are what the team sees of one student (admin): no recipient, no subject, no address.
    userApplications: (userId: string) => e().get<ApplicationList>(`/admin/users/${userId}/applications`),
    userGmail: (userId: string) => e().get<GmailStatus>(`/admin/users/${userId}/gmail`),
    updateApplication: (id: string, status: 'sent' | 'replied' | 'withdrawn' | 'closed') => e().patch<Application>(`/applications/${id}`, { status }),
    sendApplicationNow: (id: string) => e().post<Application>(`/applications/${id}/send`),
}

export default EmailService
