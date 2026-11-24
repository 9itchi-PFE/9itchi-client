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
    listUsers: () => api('account').get(`/admin/users`),
    getUser: (id: string) => api('account').get(`/admin/users/${id}`),
    suspendUser: (id: string, data?: unknown) => api('account').put(`/admin/users/${id}/suspend`, data),
    deleteUser: (id: string) => api('account').delete(`/admin/users/${id}`),
}

export default AccountService
