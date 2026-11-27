import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import HomeScreen from '@/components/public/HomeScreen'
import { ldJson } from '@/lib/publicJob'
import { siteUrl } from '@/lib/site'

// The canonical address is set here and not in the root layout, which every other page would inherit.
export const metadata: Metadata = { alternates: { canonical: '/' } }

// Screen 7.1. A signed-in visitor goes straight to their own home: the offers, or the admin.
export default async function Home() {
    const session = await auth()
    if (session && !session.error) redirect(session.user?.role === 'admin' ? '/admin' : '/jobs')
    const url = siteUrl()
    // Who runs the site and what it is, for search engines (name, logo, address).
    const data = [
        { '@context': 'https://schema.org', '@type': 'Organization', name: '9itchi PFE', url, logo: `${url}/img/9itchi-logo.png` },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: '9itchi PFE', url, inLanguage: 'fr-TN' },
    ]
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(data) }} />
            <HomeScreen />
        </>
    )
}
