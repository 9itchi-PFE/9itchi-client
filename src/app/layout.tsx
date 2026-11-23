import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import AuthProvider from '@/components/auth/AuthProvider'
import AxiosProvider from '@/components/axios/AxiosProvider'
import QueryProvider from '@/components/QueryProvider'
import '@/assets/styles/globals.css'

export const metadata: Metadata = {
    title: '9itchi',
    description: 'AI-powered resume builder, job outreach and opportunity platform',
}

export default function RootLayout({ children }: PropsWithChildren) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <QueryProvider>
                        <AxiosProvider>{children}</AxiosProvider>
                    </QueryProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
