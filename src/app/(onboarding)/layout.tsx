import type { PropsWithChildren } from 'react'

// The sign-up steps have their own header (rendered by each page with its step number).
export default function Layout({ children }: PropsWithChildren) {
    return <div className="min-h-screen min-h-dvh">{children}</div>
}
