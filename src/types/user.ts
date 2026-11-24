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
