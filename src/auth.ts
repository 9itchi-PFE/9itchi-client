import NextAuth from 'next-auth'
import authConfig from '@/configs/auth.config'

export const { handlers, signIn, signOut } = NextAuth(authConfig)

// Refresh tokens are single-use and only the /api/auth route (and the browser) can store a renewed one,
// so middleware and server components read the session without renewing it; renewing there burned the token and signed users out.
export const { auth } = NextAuth({ ...authConfig, callbacks: { ...authConfig.callbacks, jwt: async ({ token }) => token } })
