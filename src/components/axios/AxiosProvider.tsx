'use client'

import { useEffect, useMemo, type PropsWithChildren } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { SessionContext } from '@/components/auth/AuthProvider/SessionContext'
import { setAuthToken, setSessionReady, setTokenRenewer } from '@/services/ApiService'

// Puts the service token from the session on every API call, renews it once on a 401 (the renewal is shared
// by concurrent calls), signs out when it cannot be renewed, and shares the session read-only.
export default function AxiosProvider({ children }: PropsWithChildren) {
    const { data: session, update, status } = useSession()
    const token = session?.accessToken
    setAuthToken(token)
    setSessionReady(status !== 'loading')

    useEffect(() => {
        setTokenRenewer(async () => {
            const next = await update({ forceRefresh: true })
            if (!next?.accessToken || next.error) {
                await signOut({ redirectTo: '/auth/signin' })
                return undefined
            }
            return next.accessToken
        })
        return () => setTokenRenewer(undefined)
    }, [update])

    useEffect(() => {
        if (session?.error === 'RefreshFailed') signOut({ redirectTo: '/auth/signin' })
    }, [session?.error])

    const value = useMemo(() => ({ user: session?.user, token }), [session?.user, token])
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
