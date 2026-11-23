import NextAuth from 'next-auth'
import authConfig from '@/configs/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
