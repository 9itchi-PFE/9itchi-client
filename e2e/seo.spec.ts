import { expect, test } from '@playwright/test'
import { mockServices } from './services'

// What search engines read: robots.txt, the sitemap and a shared offer's metadata, all built by the Next server
// when it runs (never with the localhost address of a build).
const OFFER = '0e2e0000-0000-4000-8000-0000000005e0'

test('robots.txt and the sitemap point to the address the server runs with, and list the open offers', async ({ request, baseURL }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain(`Sitemap: ${baseURL}/sitemap.xml`)
    expect(robots).toContain('Disallow: /admin')
    expect(robots).not.toContain('Host:')

    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain(`<loc>${baseURL}/</loc>`)
    expect(sitemap).toContain(`<loc>${baseURL}/offres/${OFFER}</loc>`)
    expect(sitemap).toContain('<lastmod>2026-11-20T09:00:00Z</lastmod>')
})

test('a shared offer has its own title, description, canonical link and JobPosting data', async ({ page }) => {
    // The same invented offer mock-account.mjs gives the server, for the page the browser draws.
    await mockServices(page, {
        [`GET /job/public/jobs/${OFFER}`]: {
            id: OFFER,
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
        },
        'GET /payments/plans': { items: [] },
    })
    await page.goto(`/offres/${OFFER}`)
    await expect(page).toHaveTitle(/Plateforme de réservation · Stage PFE Société Exemple, Sousse/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Concevoir une plateforme de réservation/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/offres/${OFFER}$`))
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)

    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}')
    expect(data).toMatchObject({
        '@type': 'JobPosting',
        title: 'Plateforme de réservation',
        datePosted: '2026-11-20',
        employmentType: 'INTERN',
        hiringOrganization: { name: 'Société Exemple' },
        jobLocation: { address: { addressLocality: 'Sousse', addressCountry: 'TN' } },
    })
})

test('an unknown offer is kept out of search engines', async ({ page }) => {
    await mockServices(page, { 'GET /job/public/jobs/0e2e0000-0000-4000-8000-0000000000ff': [404, { error: 'job not found' }] })
    await page.goto('/offres/0e2e0000-0000-4000-8000-0000000000ff')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
})

test('the home page says who runs the site', async ({ page }) => {
    await mockServices(page)
    await page.goto('/')
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '[]')
    expect(data[0]).toMatchObject({ '@type': 'Organization', name: '9itchi PFE' })
    expect(data[1]).toMatchObject({ '@type': 'WebSite' })
})
