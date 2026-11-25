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
