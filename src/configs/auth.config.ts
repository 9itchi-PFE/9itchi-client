import type { NextAuthConfig } from 'next-auth'

// Credentials + Google providers call account-api; added when auth is implemented.
export default {
    providers: [],
    pages: { signIn: '/auth/signin' },
    session: { strategy: 'jwt' },
} satisfies NextAuthConfig
