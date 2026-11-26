// siteUrl is the public address of the site (from NEXTAUTH_URL), without a trailing slash: robots.txt, the
// sitemap and the links search engines and shared previews show are built from it.
export const siteUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/+$/, '')
