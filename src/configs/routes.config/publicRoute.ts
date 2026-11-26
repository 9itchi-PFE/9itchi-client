export const publicRoutes = {
    '/': {},
    '/privacy-policy': {},
    '/terms-conditions': {},
    '/cookies': {},
    '/auth/callback': {},
    // Every open offer, page by page (the lists by city and company are under /offres/).
    '/offres': {},
}

// publicPrefixes open every path under them to anyone: an offer shared by link (/offres/<id>), the lists of one
// city or company (/offres/ville/<slug>, /offres/entreprise/<slug>).
export const publicPrefixes = ['/offres/']
