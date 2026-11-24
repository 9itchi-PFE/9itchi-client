import type { PropsWithChildren } from 'react'
import { SessionProvider } from 'next-auth/react'

// The session is re-read every 5 minutes so the access token is renewed before it expires.
export default function AuthProvider({ children }: PropsWithChildren) {
    return (
        <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
            {children}
        </SessionProvider>
    )
}
