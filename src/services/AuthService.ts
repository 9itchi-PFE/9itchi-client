import { api } from './ApiService'

type AuthResponse = { user: { id: string; name: string; email: string; role: string; status: string }; access_token: string; refresh_token: string }

// Sign-in itself goes through NextAuth (configs/auth.config.ts); these are the calls made from the browser.
const AuthService = {
    // A new account gets no session: account-api emails a 6-digit code first (verifyEmail opens the session).
    signUp: (data: { name: string; email: string; password: string; school?: string; language?: string }) =>
        api('account').post<{ email: string; verification_required: boolean }>('/auth/signup', data),
    verifyEmail: (data: { email: string; code: string }) => api('account').post<AuthResponse>('/auth/verify-email', data),
    resendVerification: (email: string) => api('account').post('/auth/resend-verification', { email }),
    forgotPassword: (email: string) => api('account').post('/auth/forgot-password', { email }),
    resetPassword: (data: { email: string; code: string; new_password: string }) => api('account').post('/auth/reset-password', data),
}

export default AuthService
