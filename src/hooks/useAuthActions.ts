import AuthService from '@/services/AuthService'

export function useAuthActions() {
    return { signIn: AuthService.signIn, signUp: AuthService.signUp }
}
