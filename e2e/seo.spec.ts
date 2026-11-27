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
    expect(sitemap).toContain(`<loc>${baseURL}/offres</loc>`)
    expect(sitemap).toContain(`<loc>${baseURL}/offres/ville/sousse</loc>`)
    expect(sitemap).toContain(`<loc>${baseURL}/offres/entreprise/societe-exemple</loc>`)
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

test('the list of every open offer is drawn on the server, page by page, with links to cities and companies', async ({ page, request }) => {
    const html = await (await request.get('/offres')).text()
    expect(html).toContain('Plateforme de réservation')
    expect(html).toContain(`href="/offres/${OFFER}"`)
    expect(html).toContain('href="/offres/ville/sousse"')
    expect(html).toContain('href="/offres/entreprise/societe-exemple"')

    await mockServices(page)
    await page.goto('/offres')
    await expect(page).toHaveTitle(/^Offres de stage PFE en Tunisie/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/offres$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Offres de stage PFE en Tunisie' })).toBeVisible()
    await expect(page.getByText('21 offres de stage PFE ouvertes', { exact: false })).toBeVisible()
    await expect(page.getByText('Page 1 sur 2')).toBeVisible()
    const list = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '[]')
    expect(list[1]).toMatchObject({ '@type': 'ItemList', numberOfItems: 21 })

    await page.getByRole('link', { name: 'Page suivante' }).click()
    await expect(page).toHaveURL(/\/offres\?page=2$/)
    await expect(page).toHaveTitle(/page 2/)
    await expect(page.getByRole('link', { name: 'Sujet fictif 20' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Page précédente' })).toBeVisible()
})

test('a city and a company each have their own indexed page, and an unknown one is a 404', async ({ page, request }) => {
    await mockServices(page)
    await page.goto('/offres/ville/sousse')
    await expect(page).toHaveTitle(/^Stage PFE à Sousse/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^1 offre de stage PFE ouverte à Sousse/)
    await expect(page.getByRole('link', { name: 'Plateforme de réservation' })).toHaveAttribute('href', `/offres/${OFFER}`)
    await expect(page.getByRole('navigation', { name: 'Par ville' }).getByRole('link', { name: /Sousse/ })).toHaveAttribute('aria-current', 'page')

    await page.goto('/offres/entreprise/societe-exemple')
    await expect(page.getByRole('heading', { level: 1, name: 'Stage PFE chez Société Exemple' })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/offres\/entreprise\/societe-exemple$/)

    expect((await request.get('/offres/ville/nulle-part')).status()).toBe(404)
})

test('a shared offer leads to the other offers of its company and its city', async ({ page }) => {
    await mockServices(page, {
        [`GET /job/public/jobs/${OFFER}`]: {
            id: OFFER,
            title: 'Plateforme de réservation',
            company: 'Société Exemple',
            location: 'Sousse, Tunisie',
            contract_type: 'pfe',
            source: 'lever',
            description: 'Sujet.',
            stipend_tnd: null,
            duration_months: null,
            work_mode: null,
            closes_on: null,
            starts_on: null,
            skills: [],
            pair_ok: false,
            easy_apply: false,
            topic: null,
            book_company: '',
            book_title: '',
            closed: false,
        },
        'GET /payments/plans': { items: [] },
    })
    await page.goto(`/offres/${OFFER}`)
    await expect(page.getByRole('link', { name: 'Tous les sujets chez Société Exemple' })).toHaveAttribute('href', '/offres/entreprise/societe-exemple')
    await expect(page.getByRole('link', { name: 'Plus d’offres à Sousse' })).toHaveAttribute('href', '/offres/ville/sousse')
})
