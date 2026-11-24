import type { AdminUser, UserList, UserQuery } from '@/types/user'
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
    getMe: () => api('account').get(`/users/me`),
    updateMe: (data?: unknown) => api('account').put(`/users/me`, data),
    // setLanguage tells account-api which language to write to the user in (emails, notifications).
    setLanguage: (language: string) => api('account').put(`/users/me/language`, { language }),
    deleteMe: () => api('account').delete(`/users/me`),
    // listUsers searches the accounts by name or email (admin). Pages start at 1.
    listUsers: (params: UserQuery) => api('account').get<UserList>(`/admin/users`, { params }),
    getUser: (id: string) => api('account').get<AdminUser>(`/admin/users/${id}`),
    // suspendUser blocks the sign-in of an account (suspended true) or lets it in again (false).
    suspendUser: (id: string, suspended: boolean) => api('account').put<AdminUser>(`/admin/users/${id}/suspend`, { suspended }),
    deleteUser: (id: string) => api('account').delete(`/admin/users/${id}`),
}

export default AccountService
