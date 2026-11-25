import type { AdminUser, Me, MeInput, UserList, UserNote, UserQuery } from '@/types/user'
import { api } from './ApiService'

const AccountService = {
    signup: (data?: unknown) => api('account').post(`/auth/signup`, data),
    login: (data?: unknown) => api('account').post(`/auth/login`, data),
    refreshToken: (data?: unknown) => api('account').post(`/auth/refresh`, data),
    logout: (data?: unknown) => api('account').post(`/auth/logout`, data),
    forgotPassword: (data?: unknown) => api('account').post(`/auth/forgot-password`, data),
    resetPassword: (data?: unknown) => api('account').post(`/auth/reset-password`, data),
    googleSignIn: () => api('account').get(`/auth/google`),
    googleCallback: () => api('account').get(`/auth/google/callback`),
    getMe: () => api('account').get<Me>(`/users/me`),
    updateMe: (data: MeInput) => api('account').put<Me>(`/users/me`, data),
    // setLanguage tells account-api which language to write to the user in (emails, notifications).
    setLanguage: (language: string) => api('account').put(`/users/me/language`, { language }),
    deleteMe: () => api('account').delete(`/users/me`),
    // The profile photo: account-api keeps it square, 400 px at most (JPEG or PNG sent, 5 MB at most).
    uploadPhoto: (file: Blob) => {
        const form = new FormData()
        form.append('file', file)
        return api('account').put<{ has_photo: boolean }>(`/users/me/photo`, form)
    },
    getPhoto: () => api('account').get<Blob>(`/users/me/photo`, { responseType: 'blob' }),
    deletePhoto: () => api('account').delete<{ has_photo: boolean }>(`/users/me/photo`),
    // listUsers searches the accounts by name or email (admin). Pages start at 1.
    listUsers: (params: UserQuery) => api('account').get<UserList>(`/admin/users`, { params }),
    getUser: (id: string) => api('account').get<AdminUser>(`/admin/users/${id}`),
    // suspendUser blocks the sign-in of an account (suspended true) or lets it in again (false).
    suspendUser: (id: string, suspended: boolean) => api('account').put<AdminUser>(`/admin/users/${id}/suspend`, { suspended }),
    // The internal note of the team about a user: never shown to the user.
    getUserNote: (id: string) => api('account').get<UserNote>(`/admin/users/${id}/note`),
    setUserNote: (id: string, note: string) => api('account').put<UserNote>(`/admin/users/${id}/note`, { note }),
    deleteUser: (id: string) => api('account').delete(`/admin/users/${id}`),
}

export default AccountService
