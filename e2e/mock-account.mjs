// Stand-in for account-api, for the sign-in that NextAuth does on the server (the browser's own calls are answered
// by the fixtures in e2e/services.ts). Two invented accounts; nothing here is real.
import http from 'node:http'

const PORT = Number(process.env.E2E_ACCOUNT_PORT || 3201)
export const users = {
    'etudiant@exemple.tn': {
        id: '0e2e0000-0000-4000-8000-000000000001',
        name: 'Prénom Nom',
        email: 'etudiant@exemple.tn',
        role: 'candidate',
        status: 'active',
        school: 'ENIS',
        language: 'fr',
    },
    'equipe@exemple.tn': {
        id: '0e2e0000-0000-4000-8000-000000000002',
        name: 'Équipe 9itchi',
        email: 'equipe@exemple.tn',
        role: 'admin',
        status: 'active',
        language: 'fr',
    },
}
// An account that signed up but has not entered its emailed code: login answers 403 like account-api.
export const UNVERIFIED = {
    id: '0e2e0000-0000-4000-8000-000000000003',
    name: 'Nouvel Étudiant',
    email: 'nouveau@exemple.tn',
    role: 'candidate',
    status: 'active',
    language: 'fr',
}
// VERIFIED_ACCESS is the token e2e/services.ts hands back for POST /auth/verify-email.
export const VERIFIED_ACCESS = 'e2e-access-verified'
const PASSWORD = 'MotDePasse123'
export const SEO_OFFER = {
    id: '0e2e0000-0000-4000-8000-0000000005e0',
    title: 'Plateforme de réservation',
    company: 'Société Exemple',
    location: 'Sousse',
    contract_type: 'pfe',
    source: 'lever',
    description: 'Concevoir une plateforme de réservation en ligne avec une équipe produit de six personnes.',
    stipend_tnd: 700,
    duration_months: 6,
    work_mode: 'on_site',
    closes_on: '2027-03-31',
    starts_on: null,
    skills: ['React'],
    pair_ok: false,
    easy_apply: true,
    topic: null,
    book_company: '',
    book_title: '',
    closed: false,
    posted_at: '2026-11-20T09:00:00Z',
}
// publicOffers answers job-api GET /public/offers for the public list pages: one city (sousse), one company
// (societe-exemple), 21 offers in all so the list has a second page; anything else is a 404.
const SOUSSE = { slug: 'sousse', name: 'Sousse', count: 1 }
const EXEMPLE = { slug: 'societe-exemple', name: 'Société Exemple', count: 1 }
const OTHER = { slug: 'atelier-fictif', name: 'Atelier Fictif', count: 20 }
const item = (o) => ({
    id: o.id,
    title: o.title,
    company: o.company,
    location: o.location,
    snippet: o.description,
    posted_at: o.posted_at,
    stipend_tnd: o.stipend_tnd,
    duration_months: o.duration_months,
    work_mode: o.work_mode,
    closes_on: o.closes_on,
    skills: o.skills,
    easy_apply: o.easy_apply,
})
const others = Array.from({ length: 20 }, (_, i) => ({
    ...item(SEO_OFFER),
    id: `0e2e0000-0000-4000-8000-0000000006${String(i).padStart(2, '0')}`,
    title: `Sujet fictif ${i + 1}`,
    company: 'Atelier Fictif',
    location: 'Télétravail',
    work_mode: 'remote',
}))
function publicOffers(q) {
    const base = { page_size: 20, cities: [SOUSSE], companies: [OTHER, EXEMPLE] }
    const page = Number(q.get('page') || 1)
    const res = (items, extra) => ({ status: 200, body: { ...base, ...extra, items, total: items.length } })
    let r
    if (q.get('city')) r = q.get('city') === 'sousse' ? res([item(SEO_OFFER)], { city: SOUSSE }) : null
    else if (q.get('company')) r = q.get('company') === 'societe-exemple' ? res([item(SEO_OFFER)], { company: EXEMPLE }) : null
    else r = res([item(SEO_OFFER), ...others])
    if (!r) return { status: 404, body: { error: 'not found' } }
    const all = r.body.items
    const slice = all.slice((page - 1) * 20, page * 20)
    if (page > 1 && slice.length === 0) return { status: 404, body: { error: 'page not found' } }
    return { status: 200, body: { ...r.body, items: slice, page } }
}

let n = 0
const byToken = new Map([[VERIFIED_ACCESS, UNVERIFIED]])

http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
        const json = (status, b) => {
            res.writeHead(status, { 'content-type': 'application/json' })
            res.end(JSON.stringify(b))
        }
        const tokens = (u) => {
            n += 1
            const access = `e2e-access-${n}`
            byToken.set(access, u)
            return { access_token: access, refresh_token: `e2e-refresh-${n}` }
        }
        if (req.url === '/health') return json(200, { status: 'ok' })
        // job-api's public routes, as the Next server reads them for search engines (seo.spec.ts). Invented offer.
        if (req.method === 'GET' && req.url === '/job/public/jobs') return json(200, { items: [{ id: SEO_OFFER.id, updated_at: '2026-11-20T09:00:00Z' }] })
        if (req.method === 'GET' && req.url === `/job/public/jobs/${SEO_OFFER.id}`) return json(200, SEO_OFFER)
        if (req.method === 'GET' && req.url?.startsWith('/job/public/offers')) {
            const r = publicOffers(new URL(req.url, 'http://x').searchParams)
            return json(r.status, r.body)
        }
        if (req.method === 'GET' && req.url?.startsWith('/job/')) return json(404, { error: 'job not found' })
        if (req.method === 'POST' && req.url === '/auth/login') {
            const b = JSON.parse(body || '{}')
            if (b.email === UNVERIFIED.email && b.password === PASSWORD) return json(403, { error: 'email not verified' })
            const u = users[b.email]
            return u && b.password === PASSWORD ? json(200, { user: u, ...tokens(u) }) : json(401, { error: 'invalid credentials' })
        }
        if (req.method === 'POST' && req.url === '/auth/refresh') return json(200, tokens(users['etudiant@exemple.tn']))
        if (req.url === '/users/me') {
            const u = byToken.get(String(req.headers.authorization || '').replace(/^Bearer /, ''))
            return u ? json(200, u) : json(401, { error: 'unauthorized' })
        }
        json(404, { error: 'not found' })
    })
}).listen(PORT, () => console.log(`e2e account stand-in on ${PORT}`))
