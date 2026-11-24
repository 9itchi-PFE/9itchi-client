'use client'

import { useMemo, type PropsWithChildren } from 'react'
import { useSession } from 'next-auth/react'
import { SessionContext } from '@/components/auth/AuthProvider/SessionContext'
import type { User } from '@/@types/auth'
import { setAuthToken } from '@/services/ApiService'

// Puts the service token from the session on every API call and shares the session read-only.
// The in-flight token refresh is deduped in utils/refreshToken once login is wired.
export default function AxiosProvider({ children }: PropsWithChildren) {
    const { data } = useSession()
    const session = data as (typeof data & { accessToken?: string; user?: User }) | null
    const token = session?.accessToken
    setAuthToken(token)
    const value = useMemo(() => ({ user: session?.user as User | undefined, token }), [session?.user, token])
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
