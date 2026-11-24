import { signIn, signOut } from 'next-auth/react'
import AuthService from '@/services/AuthService'

export function useAuthActions() {
    return { signIn, signOut, signUp: AuthService.signUp }
}
