import type { Allowance, Application, ApplicationList, ApplyInput, Draft, DraftInput, Email, GmailStatus, JobMatch, MatchInput } from '@/types/application'
import type {
    EmailEdit,
    LinkDraft,
    LinkDraftInput,
    OutgoingEmail,
    Recruiter,
    RecruiterAllowance,
    RecruiterDraftInput,
    RecruiterSearch,
    RecruiterSearchInput,
} from '@/types/recruiter'
import type { LastUse } from '@/types/user'
import { api } from './ApiService'

const e = () => api('email')

const EmailService = {
    // connectGmail returns the Google consent page to send the browser to; Google comes back to /settings/gmail.
    connectGmail: () => e().get<{ url: string }>(`/gmail/connect`),
    gmailStatus: () => e().get<GmailStatus>(`/gmail/status`),
    revokeGmail: () => e().delete<GmailStatus>(`/gmail/connection`),
    // The AI can take a while to write: this call waits longer than the others.
    draftEmail: (data: DraftInput) => e().post<Draft>(`/emails/draft`, data, { timeout: 60_000 }),
    sendEmail: (data?: OutgoingEmail) => e().post(`/emails`, data),
    scheduleEmail: (data?: OutgoingEmail) => e().post(`/emails/schedule`, data),
    listEmails: () => e().get<Email[]>(`/emails`),
    getEmail: (id: string) => e().get<Email>(`/emails/${id}`),
    cancelEmail: (id: string) => e().delete(`/emails/${id}`),
    // updateEmail changes a scheduled email (recipient, text, time, CV); 409 once it has left.
    updateEmail: (id: string, data: EmailEdit) => e().patch<Email>(`/emails/${id}`, data),
    // draftFromLink writes an email from an offer link (a 9itchi offer, a company site); 422: paste the offer text.
    draftFromLink: (data: LinkDraftInput) => e().post<LinkDraft>(`/emails/draft-from-link`, data, { timeout: 60_000 }),
    // Recruiter Radar: searches count against the plan's daily limit (402 beyond it, or without a subscription).
    searchRecruiters: (data: RecruiterSearchInput) => e().post<RecruiterSearch>(`/recruiters/search`, data, { timeout: 30_000 }),
    listRecruiters: () => e().get<{ items: Recruiter[] }>(`/recruiters`),
    recruiterAllowance: () => e().get<RecruiterAllowance>(`/recruiters/allowance`),
    // draftForRecruiter writes a spontaneous application to one recruiter found by the radar.
    draftForRecruiter: (id: string, data: RecruiterDraftInput) => e().post<Draft>(`/recruiters/${id}/draft`, data, { timeout: 60_000 }),
    apply: (data: ApplyInput) => e().post<Application>(`/applications`, data),
    listApplications: () => e().get<ApplicationList>(`/applications`),
    // allowance says how the next application leaves (the CV built here, or the imported file without a
    // subscription) and how many are left.
    allowance: () => e().get<Allowance>(`/applications/allowance`),
    // findMatch is the AI's reading of the CV against an offer already made (404: none); match makes it.
    findMatch: (input: MatchInput) => e().get<JobMatch>(`/applications/match`, { params: input }),
    match: (input: MatchInput) => e().post<JobMatch>(`/applications/match`, input),
    // userApplications and userGmail are what the team sees of one student (admin): no recipient, no subject, no address.
    userApplications: (userId: string) => e().get<ApplicationList>(`/admin/users/${userId}/applications`),
    // userBuiltSends is how many applications a student sent with the CV built in 9itchi, and the last time (admin).
    userBuiltSends: (userId: string) => e().get<LastUse>(`/admin/users/${userId}/sent-with-cv`),
    userGmail: (userId: string) => e().get<GmailStatus>(`/admin/users/${userId}/gmail`),
    updateApplication: (id: string, status: 'sent' | 'replied' | 'withdrawn' | 'closed') => e().patch<Application>(`/applications/${id}`, { status }),
    sendApplicationNow: (id: string) => e().post<Application>(`/applications/${id}/send`),
}

export default EmailService
