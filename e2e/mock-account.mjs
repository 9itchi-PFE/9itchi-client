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
    work_mode: 'onsite',
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
let n = 0
const byToken = new Map()

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
        if (req.method === 'GET' && req.url?.startsWith('/job/')) return json(404, { error: 'job not found' })
        if (req.method === 'POST' && req.url === '/auth/login') {
            const b = JSON.parse(body || '{}')
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
