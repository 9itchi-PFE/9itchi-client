import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

// sitemap.xml: the pages anyone can open. Offers are shared by link, not listed here.
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
        { url: `${siteUrl}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${siteUrl}/terms-conditions`, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${siteUrl}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
    ]
}
