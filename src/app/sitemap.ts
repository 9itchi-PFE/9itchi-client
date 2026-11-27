import type { MetadataRoute } from 'next'
import { getPublicJobIndex, getPublicOffers } from '@/lib/publicJob'
import { siteUrl } from '@/lib/site'

// Read at each request (the address of the running server, the offers open today); job-api caches its list an hour.
export const dynamic = 'force-dynamic'

// sitemap.xml: the public pages, the lists of open offers (all, by city, by company) and every published offer
// still open, as shared by link (/offres/<id>).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = siteUrl()
    const [offers, lists] = await Promise.all([getPublicJobIndex(), getPublicOffers({})])
    const facets = lists && lists !== 'missing' ? lists : { cities: [], companies: [] }
    return [
        { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
        { url: `${base}/offres`, changeFrequency: 'daily', priority: 0.9 },
        ...facets.cities.map((c) => ({ url: `${base}/offres/ville/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.7 })),
        ...facets.companies.map((c) => ({ url: `${base}/offres/entreprise/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
        ...offers.map((o) => ({ url: `${base}/offres/${o.id}`, lastModified: o.updated_at, changeFrequency: 'weekly' as const, priority: 0.8 })),
        { url: `${base}/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${base}/terms-conditions`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${base}/cookies`, changeFrequency: 'yearly', priority: 0.2 },
    ]
}
