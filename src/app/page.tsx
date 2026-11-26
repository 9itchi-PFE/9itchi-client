import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import HomeScreen from '@/components/public/HomeScreen'

// The canonical address is set here and not in the root layout, which every other page would inherit.
export const metadata: Metadata = { alternates: { canonical: '/' } }

// Screen 7.1. A signed-in visitor goes straight to their own home: the offers, or the admin.
export default async function Home() {
    const session = await auth()
    if (session && !session.error) redirect(session.user?.role === 'admin' ? '/admin' : '/jobs')
    return <HomeScreen />
}
