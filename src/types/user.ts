// AdminUser is an account as the admin sees it (account-api).
export type AdminUser = {
    id: string
    name: string
    email: string
    role: 'admin' | 'candidate'
    status: 'active' | 'suspended' | (string & {})
    school?: string
    language: string
    created_at: string
    updated_at: string
}

export type UserStatus = '' | 'active' | 'suspended'

// UserQuery is what the list is asked for: a search on name or email, a status, a page (from 1).
export type UserQuery = { q?: string; status?: UserStatus; role?: 'candidate' | 'admin'; page: number; page_size: number }

export type UserList = { items: AdminUser[]; total: number; page: number; page_size: number }

// UserNote is the team's internal note about a student. updated_at is null when nothing was ever written.
export type UserNote = { user_id: string; note: string; updated_at: string | null }

// LastUse is how many times a student used something a subscription pays for, and when they last did (resume-api:
// CV downloads; email-api: applications sent with the CV built in 9itchi).
export type LastUse = { count: number; last_at: string | null }

// UserCV is where a student's CV stands for the team: counts only (resume-api).
export type UserCV = { resume_id: string; title: string; resumes: number; version: number; passed: number; total: number; to_fix: number; updated_at: string }

// Me is the signed-in student's own account, as account-api returns it.
export const YEARS = ['l3', 'm1', 'm2', 'ing1', 'ing2', 'ing3', 'other'] as const
export type Year = (typeof YEARS)[number]
// ProfileMore is the optional rest of the profile (account-api): each value '' when not given.
export type ProfileMore = { phone: string; city: string; speciality: string; year: Year | ''; linkedin: string; github: string }
export type Me = {
    id: string
    name: string
    email: string
    role: string
    status: string
    school?: string
    language: string
    has_photo?: boolean
} & Partial<ProfileMore>
// MeInput is what the student changes: '' clears a value, a key left out keeps it.
export type MeInput = { name: string; school: string } & Partial<ProfileMore>
