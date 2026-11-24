import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import AuthProvider from '@/components/auth/AuthProvider'
import AxiosProvider from '@/components/axios/AxiosProvider'
import QueryProvider from '@/components/QueryProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { dirOf, type Locale } from '@/i18n/locales'
import '@/assets/styles/globals.css'

export const metadata: Metadata = {
    title: '9itchi PFE',
    description: 'Trouve ton stage PFE et postule en un clic.',
}

export default async function RootLayout({ children }: PropsWithChildren) {
    const locale = (await getLocale()) as Locale
    const messages = await getMessages()
    return (
        <html lang={locale} dir={dirOf(locale)}>
            <body>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <AuthProvider>
                        <QueryProvider>
                            <AxiosProvider>
                                <ToastProvider>{children}</ToastProvider>
                            </AxiosProvider>
                        </QueryProvider>
                    </AuthProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
