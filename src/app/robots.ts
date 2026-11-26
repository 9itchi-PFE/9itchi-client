import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

// robots.txt: search engines read the public pages (home, shared offers, legal pages) and nothing behind sign-in.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/offres/', '/privacy-policy', '/terms-conditions', '/cookies'],
            disallow: [
                '/api/',
                '/auth/',
                '/admin',
                '/jobs',
                '/books',
                '/resumes',
                '/applications',
                '/emails',
                '/outreach',
                '/notifications',
                '/settings',
                '/support',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    }
}
