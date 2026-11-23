import { api } from './ApiService'

const AuthService = {
    signIn: (data: { email: string; password: string }) => api('account').post('/auth/login', data),
    signUp: (data: unknown) => api('account').post('/auth/signup', data),
    refresh: (data: { refresh_token: string }) => api('account').post('/auth/refresh', data),
}

export default AuthService
