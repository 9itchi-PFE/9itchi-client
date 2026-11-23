import type { PropsWithChildren } from 'react'
import AuthLayout from '@/components/layouts/AuthLayout'

export default function Layout({ children }: PropsWithChildren) {
    return <AuthLayout>{children}</AuthLayout>
}
