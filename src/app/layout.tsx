import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import AuthProvider from '@/components/auth/AuthProvider'
import AxiosProvider from '@/components/axios/AxiosProvider'
import QueryProvider from '@/components/QueryProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { dirOf, type Locale } from '@/i18n/locales'
import { siteUrl } from '@/lib/site'
import '@/assets/styles/globals.css'

const description =
    'Toutes les offres de stage PFE de Tunisie au même endroit : les PFE books des entreprises, un CV corrigé selon les règles des recruteurs et une lettre pour chaque offre, envoyée depuis ton Gmail.'

// What search engines and shared links show: title, description, the site's address and its logo.
export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: { default: '9itchi PFE · Trouve ton stage PFE et postule en un clic', template: '%s · 9itchi PFE' },
    description,
    applicationName: '9itchi PFE',
    openGraph: {
        type: 'website',
        siteName: '9itchi PFE',
        locale: 'fr_TN',
        title: '9itchi PFE · Trouve ton stage PFE et postule en un clic',
        description,
        images: [{ url: '/img/9itchi-logo.png', alt: '9itchi PFE' }],
    },
    twitter: { card: 'summary', title: '9itchi PFE', description, images: ['/img/9itchi-logo.png'] },
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
