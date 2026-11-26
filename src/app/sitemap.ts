import type { MetadataRoute } from 'next'
import { getPublicJobIndex } from '@/lib/publicJob'
import { siteUrl } from '@/lib/site'

// Read at each request (the address of the running server, the offers open today); job-api caches its list an hour.
export const dynamic = 'force-dynamic'

// sitemap.xml: the public pages and every published offer still open, as shared by link (/offres/<id>).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = siteUrl()
    const offers = await getPublicJobIndex()
    return [
        { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
        ...offers.map((o) => ({ url: `${base}/offres/${o.id}`, lastModified: o.updated_at, changeFrequency: 'weekly' as const, priority: 0.8 })),
        { url: `${base}/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${base}/terms-conditions`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${base}/cookies`, changeFrequency: 'yearly', priority: 0.2 },
    ]
}
