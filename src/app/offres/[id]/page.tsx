import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import PublicOffer from '@/components/public/PublicOffer'
import { getPublicJob, jobPosting, ldJson, plain } from '@/lib/publicJob'
import { siteUrl } from '@/lib/site'

// What search engines and shared previews show of the offer; a closed or unknown offer is not indexed.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const job = await getPublicJob(id)
    if (!job) return { title: 'Offre de stage PFE', robots: { index: false } }
    const where = [job.company, job.location].filter(Boolean).join(', ')
    const title = `${job.title} · Stage PFE ${where}`
    const description = plain(job.description) || `Stage PFE chez ${job.company}. Postule en un clic avec 9itchi PFE.`
    return {
        title,
        description,
        alternates: { canonical: `/offres/${id}` },
        robots: job.closed ? { index: false, follow: true } : undefined,
        openGraph: { type: 'article', title, description, url: `/offres/${id}` },
        twitter: { card: 'summary', title, description },
    }
}

// Screen 7.2: an offer shared by link. A signed-in student sees it inside 9itchi, where they can apply.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (session && !session.error && session.user?.role !== 'admin') redirect(`/jobs/${encodeURIComponent(id)}`)
    const job = await getPublicJob(id)
    return (
        <>
            {job && !job.closed ? (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jobPosting(job, `${siteUrl()}/offres/${id}`)) }} />
            ) : null}
            <PublicOffer id={id} />
        </>
    )
}
