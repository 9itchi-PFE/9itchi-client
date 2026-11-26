import type { Page, Request, Route } from '@playwright/test'

// The services the browser calls are answered here, never the real ones: each test says what it needs on top of
// these defaults. Every person, company and offer below is invented.

export const STUDENT = { email: 'etudiant@exemple.tn', password: 'MotDePasse123', id: '0e2e0000-0000-4000-8000-000000000001' }
export const ADMIN = { email: 'equipe@exemple.tn', password: 'MotDePasse123', id: '0e2e0000-0000-4000-8000-000000000002' }
export const RESUME_ID = '0e2e0000-0000-4000-8000-0000000000c1'

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)

export const job = (id: string, title: string, company: string, extra: Record<string, unknown> = {}) => ({
    id,
    title,
    company,
    location: 'Sfax',
    contract_type: 'PFE',
    source_url: 'https://exemple.tn/offre',
    source: 'book',
    snippet: `Sujet ${title} chez ${company}.`,
    posted_at: new Date().toISOString(),
    stipend_tnd: 400,
    duration_months: 6,
    work_mode: 'on_site',
    starts_on: day(60),
    closes_on: day(30),
    skills: ['React', 'Go'],
    pair_ok: false,
    book_id: null,
    easy_apply: true,
    ref: null,
    pdf_page: null,
    places: 1,
    topic: 'web',
    saved: false,
    ...extra,
})

export const JOBS = [
    job('0e2e0000-0000-4000-8000-0000000000a1', 'Portail web des marchands', 'Entreprise Alpha'),
    job('0e2e0000-0000-4000-8000-0000000000a2', 'Tableau de bord IoT', 'Entreprise Beta', { skills: ['Python', 'MQTT'] }),
]

// RECRUITERS are invented people of an invented company (the demo provider's .example domains), one without an email.
export const RECRUITERS = [
    {
        id: '0e2e0000-0000-4000-8000-0000000000d1',
        name: 'Amira Ben Salah',
        title: 'Responsable recrutement',
        company: 'Entreprise Alpha',
        domain: 'entreprise-alpha.example',
        email: 'amira.bensalah@entreprise-alpha.example',
        linkedin_url: 'https://www.linkedin.com/in/amira-ben-salah-0e2e',
        confidence: 86,
        created_at: new Date().toISOString(),
    },
    {
        id: '0e2e0000-0000-4000-8000-0000000000d2',
        name: 'Karim Trabelsi',
        title: 'Talent Acquisition',
        company: 'Entreprise Alpha',
        domain: 'entreprise-alpha.example',
        email: '',
        linkedin_url: '',
        confidence: 40,
        created_at: new Date().toISOString(),
    },
]
export const EMAIL_ID = '0e2e0000-0000-4000-8000-0000000000e1'
const recruiterAllowance = { limit: 6, used: 1, remaining: 5, resets_at: new Date(Date.now() + 86_400_000).toISOString() }

export const RESUME = {
    id: RESUME_ID,
    title: 'Mon CV',
    template_id: null,
    version: 1,
    parse_status: 'done',
    language: 'fr',
    has_photo: false,
    content: {
        contact: { name: 'Prénom Nom', email: STUDENT.email, phone: '', location: 'Sfax', links: [] },
        summary: 'Élève ingénieur en génie logiciel.',
        experience: [],
        education: [{ school: 'École d’ingénieurs', degree: 'Cycle ingénieur', start: '2022', end: '2027' }],
        projects: [],
        skills: ['React', 'TypeScript'],
        languages: ['Français', 'Anglais'],
        certifications: [],
    },
    created_at: '2026-11-01T09:00:00Z',
    updated_at: '2026-11-20T09:00:00Z',
}

type Handler = (req: Request, url: URL) => unknown | Promise<unknown>
// A key is "METHOD /service/path"; a value is the JSON body (or a Buffer, sent as an image), or a function that returns it.
// [status, body] sets the status.
export type Answers = Record<string, unknown>

const defaults = (): Answers => ({
    'GET /account/users/me': {
        id: STUDENT.id,
        name: 'Prénom Nom',
        email: STUDENT.email,
        role: 'candidate',
        status: 'active',
        school: 'ENIS',
        language: 'fr',
    },
    'GET /job/jobs': { items: JOBS, total: JOBS.length, page: 1, page_size: 20 },
    'GET /job/jobs/counts': { open: 2, for_you: 2, saved: 0, new_today: 1 },
    'GET /job/preferences': [404, { error: 'not found' }],
    'GET /job/books': { items: [], total: 0, page: 1, page_size: 20 },
    'GET /resume/resumes': { items: [RESUME], total: 1, page: 1, page_size: 100 },
    [`GET /resume/resumes/${RESUME_ID}`]: RESUME,
    [`POST /resume/resumes/${RESUME_ID}/ats-check`]: { passed: 24, total: 24, to_fix: 0, rules: [] },
    'GET /email/applications': { items: [] },
    'GET /email/applications/allowance': { mode: 'plan', limit: null, used: 0 },
    'GET /email/applications/match': [404, { error: 'no analysis yet' }],
    'GET /email/emails': [],
    [`PATCH /email/emails/${EMAIL_ID}`]: { id: EMAIL_ID, status: 'scheduled' },
    'POST /email/emails/draft-from-link': {
        subject: 'Candidature : Stage PFE',
        body: 'Madame, Monsieur,',
        limit: null,
        used: 0,
        job_id: null,
        offer: { source: 'exemple.tn', title: 'Stage PFE', company: 'Entreprise Alpha' },
    },
    'GET /email/recruiters': { items: RECRUITERS },
    'GET /email/recruiters/allowance': recruiterAllowance,
    'POST /email/recruiters/search': {
        search_id: '0e2e0000-0000-4000-8000-0000000000f1',
        provider: 'fake',
        cached: false,
        items: RECRUITERS,
        allowance: recruiterAllowance,
    },
    [`POST /email/recruiters/${RECRUITERS[0].id}/draft`]: { subject: 'Candidature spontanée', body: 'Madame, Monsieur,', limit: null, used: 0 },
    'GET /payments/subscriptions/me': { subscription: null, plan: null },
    'GET /notification/notifications': { items: [], unread: 0 },
})

const SERVICES = ['account', 'resume', 'ai', 'job', 'email', 'tracker', 'notification', 'chat', 'payments', 'statistics', 'schedule']

// mockServices answers every call the browser makes to a service. It returns the requests it saw, so a test can
// check what was sent.
export async function mockServices(page: Page, answers: Answers = {}) {
    const all = { ...defaults(), ...answers }
    const seen: { method: string; path: string; body: unknown }[] = []
    await page.route(/^http:\/\/(e2e\.test|localhost:3201)\//, async (route: Route) => {
        const req = route.request()
        const url = new URL(req.url())
        const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
        // localhost:3201 is account-api for the browser too; e2e.test/<service>/ are the others.
        const path = url.host === 'localhost:3201' ? `/account${url.pathname}` : url.pathname
        let body: unknown = null
        try {
            body = req.postDataJSON()
        } catch {
            body = req.postData()
        }
        seen.push({ method: req.method(), path, body })
        const key = `${req.method()} ${path}`
        let answer = all[key]
        if (typeof answer === 'function') answer = await (answer as Handler)(req, url)
        let status = 200
        if (Array.isArray(answer) && answer.length === 2 && typeof answer[0] === 'number') [status, answer] = answer as [number, unknown]
        // Bytes (a photo) are sent as they are.
        if (Buffer.isBuffer(answer)) return route.fulfill({ status, headers: cors, contentType: 'image/png', body: answer })
        if (answer === undefined) {
            // Anything not listed: an empty answer, so a page that reads more than the test cares about still opens.
            answer = req.method() === 'GET' ? { items: [], total: 0 } : {}
            if (!SERVICES.some((s) => path.startsWith(`/${s}/`))) status = 404
        }
        return route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(answer) })
    })
    return seen
}

// signIn goes through the real sign-in page and form, and waits until the student or the team has left it (a
// page compiled for the first time by the dev server can take a while). fails: the sign-in is expected to fail.
export async function signIn(page: Page, who: { email: string; password: string }, { fails = false } = {}) {
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(who.email)
    await page.getByLabel('Mot de passe').fill(who.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    if (!fails) await page.waitForURL((u) => !u.pathname.startsWith('/auth/'), { timeout: 45_000 })
}
