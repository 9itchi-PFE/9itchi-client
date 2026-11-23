'use client'

import type { PropsWithChildren } from 'react'

// Will attach Authorization: Bearer {token} and dedup the in-flight token refresh (to be implemented).
export default function AxiosProvider({ children }: PropsWithChildren) {
    return <>{children}</>
}
