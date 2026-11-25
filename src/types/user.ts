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

// UserCV is where a student's CV stands for the team: counts only (resume-api).
export type UserCV = { resume_id: string; title: string; resumes: number; version: number; passed: number; total: number; to_fix: number; updated_at: string }

// Me is the signed-in student's own account, as account-api returns it.
export type Me = { id: string; name: string; email: string; role: string; status: string; school?: string; language: string }
// MeInput is what the student changes: school '' clears it.
export type MeInput = { name: string; school: string }
