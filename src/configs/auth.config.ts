import type { NextAuthConfig, User } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { getServerBaseUrl } from '@/configs/services.config'
import { refreshTokens } from '@/utils/refreshToken'

// The account-api access token lives 15 minutes; it is renewed a minute before.
const ACCESS_TTL_MS = 14 * 60 * 1000

type ApiUser = { id: string; name: string; email: string; role: 'admin' | 'candidate'; status: string; school?: string }

const account = () => getServerBaseUrl('account').replace(/\/$/, '')

const toUser = (u: ApiUser, access: string, refresh: string): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    school: u.school,
    accessToken: access,
    refreshToken: refresh,
})

async function me(access: string): Promise<ApiUser | null> {
    const res = await fetch(`${account()}/users/me`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' })
    return res.ok ? ((await res.json()) as ApiUser) : null
}

// Sign-in goes through account-api: email and password, or the tokens handed back by a Google or LinkedIn
// sign-in (and by sign-up). The service token is the encrypted JWT of account-api, kept in the NextAuth JWT.
export default {
    providers: [
        Credentials({
            id: 'credentials',
            credentials: { email: {}, password: {} },
            async authorize(c) {
                const email = String(c?.email ?? '')
                const password = String(c?.password ?? '')
                if (!email || !password) return null
                const res = await fetch(`${account()}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    cache: 'no-store',
                })
                if (!res.ok) return null
                const data = (await res.json()) as { user: ApiUser; access_token: string; refresh_token: string }
                return toUser(data.user, data.access_token, data.refresh_token)
            },
        }),
        Credentials({
            id: 'tokens',
            credentials: { access_token: {}, refresh_token: {} },
            async authorize(c) {
                const access = String(c?.access_token ?? '')
                const refresh = String(c?.refresh_token ?? '')
                if (!access || !refresh) return null
                const u = await me(access)
                return u ? toUser(u, access, refresh) : null
            },
        }),
    ],
    pages: { signIn: '/auth/signin' },
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    role: user.role,
                    status: user.status,
                    school: user.school,
                    accessToken: user.accessToken,
                    refreshToken: user.refreshToken,
                    accessExpires: Date.now() + ACCESS_TTL_MS,
                    error: undefined,
                }
            }
            // A service answered 401: the client asks for a renewal even if the token should still be valid.
            const forced = trigger === 'update' && (session as { forceRefresh?: boolean } | undefined)?.forceRefresh
            if (!forced && typeof token.accessExpires === 'number' && Date.now() < token.accessExpires) return token
            if (!token.refreshToken) return { ...token, error: 'RefreshFailed' }
            try {
                const t = await refreshTokens(String(token.refreshToken))
                return { ...token, accessToken: t.access_token, refreshToken: t.refresh_token, accessExpires: Date.now() + ACCESS_TTL_MS, error: undefined }
            } catch {
                return { ...token, accessToken: undefined, error: 'RefreshFailed' }
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string | undefined
            session.error = token.error as 'RefreshFailed' | undefined
            session.user = {
                ...session.user,
                id: String(token.id ?? ''),
                name: session.user?.name ?? '',
                email: session.user?.email ?? '',
                role: (token.role as 'admin' | 'candidate') ?? 'candidate',
                status: String(token.status ?? ''),
                school: token.school as string | undefined,
            }
            return session
        },
    },
} satisfies NextAuthConfig
