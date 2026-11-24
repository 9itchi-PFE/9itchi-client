import { api } from './ApiService'

type AuthResponse = { user: { id: string; name: string; email: string; role: string; status: string }; access_token: string; refresh_token: string }

// Sign-in itself goes through NextAuth (configs/auth.config.ts); these are the calls made from the browser.
const AuthService = {
    signUp: (data: { name: string; email: string; password: string; school?: string; language?: string }) =>
        api('account').post<AuthResponse>('/auth/signup', data),
    forgotPassword: (email: string) => api('account').post('/auth/forgot-password', { email }),
    resetPassword: (data: { email: string; code: string; new_password: string }) => api('account').post('/auth/reset-password', data),
}

export default AuthService
