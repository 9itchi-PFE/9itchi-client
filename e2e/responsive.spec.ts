import { expect, test, type Page } from '@playwright/test'
import { ADMIN, JOBS, RESUME, RESUME_ID, STUDENT, mockServices, signIn } from './services'

// Responsive guard. Every page below is opened on a phone and on a tablet (touch screens) and must not:
//  - scroll sideways, or draw an element outside the screen (unless it sits in its own scrolling bar);
//  - use a text field under 16px on a phone (iOS Safari zooms the page when such a field takes the focus);
//  - offer a tap target under 32px, unless it carries the `hit` class (44px touch area, see globals.css).
// When a new screen fails here, fix the screen: do not loosen the guard. The rules are in CLAUDE.md, « Responsive ».

const BOOK_ID = '0e2e0000-0000-4000-8000-0000000000b1'
const book = (id: string, company: string) => ({
    id,
    company,
    sector: 'Informatique',
    city: 'Sfax',
    title: `Book PFE 2027 ${company}`,
    summary: 'Les sujets de fin d’études proposés cette année par l’entreprise.',
    year: 2027,
    published_on: '2026-10-01',
    pdf_url: null,
    pages: 12,
    open_jobs: 2,
    for_you: 1,
    created_at: '2026-10-01T09:00:00Z',
    has_pdf: false,
})
const APPLICATIONS = {
    items: JOBS.map((j, i) => ({
        id: `0e2e0000-0000-4000-8000-00000000d${i}`,
        job_id: j.id,
        email_id: null,
        status: i ? 'sent' : 'scheduled',
        job_title: j.title,
        company: j.company,
        via: 'gmail',
        email: {
            id: `e${i}`,
            recipient: 'rh@exemple.tn',
            subject: `Candidature ${j.title}`,
            status: 'sent',
            scheduled_at: null,
            sent_at: '2026-11-20T09:00:00Z',
        },
        created_at: '2026-11-20T09:00:00Z',
        updated_at: '2026-11-20T09:00:00Z',
    })),
}
const ANSWERS = {
    'GET /job/books': { items: [book(BOOK_ID, 'Safran'), book('b2', 'Entreprise Beta')], total: 2, page: 1, page_size: 12 },
    [`GET /job/books/${BOOK_ID}`]: { ...book(BOOK_ID, 'Safran'), jobs: JOBS.map((j) => ({ ...j, book_id: BOOK_ID, pdf_page: 3 })) },
    [`GET /job/jobs/${JOBS[0].id}`]: { ...JOBS[0], description: 'Description détaillée du sujet.', book: null, requirements: [], saved: false },
    'GET /email/applications': APPLICATIONS,
    'GET /email/gmail/status': { connected: false },
    [`GET /resume/resumes/${RESUME_ID}`]: RESUME,
}

const PUBLIC = ['/', '/offres', '/offres/ville/sousse', '/auth/signin', '/auth/signup', '/auth/forgot-password', '/terms-conditions']
const STUDENT_PAGES = [
    '/jobs',
    `/jobs/${JOBS[0].id}/apply`,
    '/books',
    `/books/${BOOK_ID}`,
    '/resumes',
    `/resumes/${RESUME_ID}`,
    `/resumes/${RESUME_ID}/check`,
    '/applications',
    '/outreach',
    '/outreach/link',
    '/notifications',
    '/settings',
    '/settings/billing',
    '/support',
]
const ADMIN_PAGES = ['/admin', '/admin/users', '/admin/books', '/admin/plans', '/admin/credits', '/admin/schools']

// Runs in the page.
function measure() {
    const vw = window.innerWidth
    const sig = (el: Element) => {
        const text = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || (el as HTMLInputElement).placeholder || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 36)
        return `${el.tagName.toLowerCase()} "${text}" .${(el.getAttribute('class') || '').split(/\s+/).slice(0, 5).join(' ')}`
    }
    const shown = (el: Element) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'
    }
    const inOwnScroller = (el: Element) => {
        for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
            if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX) && p.getBoundingClientRect().right <= vw + 1) return true
        }
        return false
    }
    const offscreen: string[] = []
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (!shown(el) || el.closest('[aria-hidden="true"],svg')) continue
        const r = el.getBoundingClientRect()
        if ((r.right > vw + 1 || r.left < -1) && !inOwnScroller(el)) offscreen.push(`${Math.round(Math.max(r.right - vw, -r.left))}px ${sig(el)}`)
    }
    const smallFields: string[] = []
    const fields = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]),select,textarea'
    for (const el of Array.from(document.querySelectorAll(fields))) {
        if (shown(el) && parseFloat(getComputedStyle(el).fontSize) < 16) smallFields.push(`${getComputedStyle(el).fontSize} ${sig(el)}`)
    }
    const smallTargets: string[] = []
    const targets =
        'a[href],button,input:not([type=hidden]):not([type=file]),select,textarea,[role=button],[role=tab],[role=radio],[role=switch],[role=checkbox],summary'
    for (const el of Array.from(document.querySelectorAll(targets))) {
        if (!shown(el) || el.closest('[aria-hidden="true"]')) continue
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue
        const type = (el as HTMLInputElement).type
        if (type === 'range') continue
        let r = el.getBoundingClientRect()
        // A field inside a <label> is focused by a tap anywhere on the label: that is its touch area.
        const label = /^(input|select|textarea)$/i.test(el.tagName) ? el.closest('label') : null
        if (label) r = label.getBoundingClientRect()
        if (el.classList.contains('hit')) {
            // The touch area is drawn by ::after (see globals.css): it must reach 44px on both sides.
            const after = getComputedStyle(el, '::after')
            if (Math.max(parseFloat(after.height) || 0, r.height) < 44 || Math.max(parseFloat(after.width) || 0, r.width) < 44)
                smallTargets.push(`hit area under 44px ${sig(el)}`)
            continue
        }
        if (Math.min(r.width, r.height) < 32) smallTargets.push(`${Math.round(r.width)}x${Math.round(r.height)} ${sig(el)}`)
    }
    return {
        sideways: document.documentElement.scrollWidth - vw,
        offscreen: Array.from(new Set(offscreen)).slice(0, 6),
        smallFields: Array.from(new Set(smallFields)).slice(0, 6),
        smallTargets: Array.from(new Set(smallTargets)).slice(0, 8),
    }
}

// check returns what is wrong on one page, so a test reports every page at once.
async function check(page: Page, route: string, phone: boolean) {
    // The dev server can reload a page the first time it compiles it: one retry, never more.
    await page.goto(route, { waitUntil: 'networkidle' }).catch(() => page.goto(route, { waitUntil: 'networkidle' }))
    await page.waitForTimeout(400)
    const m = await page.evaluate(measure)
    const problems: string[] = []
    if (m.sideways > 1) problems.push(`${route} scrolls sideways by ${m.sideways}px`)
    for (const o of m.offscreen) problems.push(`${route} draws outside the screen: ${o}`)
    if (phone) for (const f of m.smallFields) problems.push(`${route} text field under 16px: ${f}`)
    for (const t of m.smallTargets) problems.push(`${route} tap target under 32px without the hit class: ${t}`)
    return problems
}

async function checkAll(page: Page, routes: string[], phone: boolean) {
    const problems: string[] = []
    for (const route of routes) problems.push(...(await check(page, route, phone)))
    expect(problems).toEqual([])
}

const SCREENS = [
    { name: 'phone', viewport: { width: 360, height: 740 }, phone: true },
    { name: 'tablet', viewport: { width: 768, height: 1024 }, phone: false },
]

for (const screen of SCREENS) {
    test.describe(`responsive guard, ${screen.name}`, () => {
        test.use({ viewport: screen.viewport, hasTouch: true, isMobile: true })

        test('public pages', async ({ page }) => {
            await mockServices(page, ANSWERS)
            await checkAll(page, PUBLIC, screen.phone)
        })

        test('student pages', async ({ page }) => {
            await mockServices(page, ANSWERS)
            await signIn(page, STUDENT)
            await checkAll(page, STUDENT_PAGES, screen.phone)
        })

        test('admin pages', async ({ page }) => {
            await mockServices(page, {
                ...ANSWERS,
                'GET /account/users/me': { id: ADMIN.id, name: 'Équipe 9itchi', email: ADMIN.email, role: 'admin', status: 'active', language: 'fr' },
                'GET /statistics/admin/integrations': {
                    month: '2026-11',
                    integrations: [
                        { provider: 'gemini', label: 'Gemini', kind: 'ai', unit: 'tokens', quota: 1000000, used: 420000, remaining: 580000, percent: 42, has_token: true, token_hint: '••••1234' },
                        { provider: 'openai', label: 'OpenAI', kind: 'ai', unit: 'tokens', quota: 0, used: 0, remaining: 0, percent: 0, has_token: false, token_hint: '' },
                        { provider: 'llamaindex', label: 'LlamaIndex Extract', kind: 'plugin', unit: 'documents', quota: 100, used: 95, remaining: 5, percent: 95, has_token: false, token_hint: '' },
                    ],
                },
            })
            await signIn(page, ADMIN)
            await checkAll(page, ADMIN_PAGES, screen.phone)
        })
    })
}

test.describe('on a touch screen under 1024px', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

    test('a tap on an offer brings its details into view', async ({ page }) => {
        await mockServices(page, ANSWERS)
        await signIn(page, STUDENT)
        await page.goto('/jobs')
        await page.getByText(JOBS[1].title, { exact: true }).first().click()
        await expect(page.locator('#offer-detail')).toBeInViewport({ timeout: 8000 })
        await expect(page.locator('#offer-detail').getByRole('heading', { name: JOBS[1].title })).toBeVisible()
        await page.getByRole('link', { name: /Retour aux offres/ }).click()
        await expect(page.locator('#offers-list')).toBeInViewport()
    })
})
