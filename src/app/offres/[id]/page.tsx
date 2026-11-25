import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import PublicOffer from '@/components/public/PublicOffer'

// Screen 7.2: an offer shared by link. A signed-in student sees it inside 9itchi, where they can apply.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (session && !session.error && session.user?.role !== 'admin') redirect(`/jobs/${encodeURIComponent(id)}`)
    return <PublicOffer id={id} />
}
