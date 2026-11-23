import type { PropsWithChildren } from 'react'

const AuthLayout = ({ children }: PropsWithChildren) => (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">{children}</main>
)

export default AuthLayout
