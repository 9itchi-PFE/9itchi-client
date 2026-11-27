// The public address of the site, without a trailing slash: robots.txt, the sitemap, canonical links and what
// shared previews show are built from it.
const PRODUCTION_URL = 'https://9itchi-pfe.com'

// siteUrl is read when the server runs (NEXTAUTH_URL of the container), never frozen at build time: an image built
// without the variable once served robots.txt and sitemap.xml pointing to localhost. A production server without the
// variable falls back on the real domain.
export function siteUrl(): string {
    const set = process.env.NEXTAUTH_URL?.trim()
    const url = set || (process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:3000')
    return url.replace(/\/+$/, '')
}
