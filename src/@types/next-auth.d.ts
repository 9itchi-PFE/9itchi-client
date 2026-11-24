import type { User as AppUser } from './auth'

declare module 'next-auth' {
    interface Session {
        accessToken?: string
        error?: 'RefreshFailed'
        user: AppUser & { image?: string | null }
    }
    interface User {
        role?: AppUser['role']
        status?: string
        school?: string
        accessToken?: string
        refreshToken?: string
    }
}
