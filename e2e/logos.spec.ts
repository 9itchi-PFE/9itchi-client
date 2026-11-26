import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { ADMIN, JOBS, STUDENT, mockServices, signIn } from './services'

const LOGO = readFileSync(join(__dirname, 'fixtures', 'logo.png'))
const ALPHA = { company: 'Entreprise Alpha', key: 'entreprise alpha', version: 1, updated_at: '2026-11-25T20:00:00Z' }

test('an offer of a company with a logo shows it; another shows its initials', async ({ page }) => {
    const seen = await mockServices(page, {
        'GET /job/public/logos': { items: [ALPHA] },
        'GET /job/public/logos/entreprise%20alpha': LOGO,
    })
    await signIn(page, STUDENT)
    await page.goto('/jobs')
    const alpha = page.getByRole('article').filter({ hasText: 'Portail web des marchands' }).first()
    await expect(alpha.locator('img[src*="/public/logos/entreprise%20alpha?v=1"]')).toBeVisible()
    const beta = page.getByRole('article').filter({ hasText: 'Tableau de bord IoT' }).first()
    await expect(beta.getByText('EB', { exact: true })).toBeVisible()
    // One read for the whole list, not one per offer (the dev server may mount the page twice).
    expect(seen.filter((r) => r.path === '/job/public/logos').length).toBeLessThanOrEqual(2)
    expect(seen.filter((r) => r.path.startsWith('/job/public/logos/')).length).toBeLessThanOrEqual(2)
})

const REVIEW = {
    ...JOBS[1],
    review_status: 'pending',
    origin: 'manual',
    apply_email: null,
    description: 'Un sujet IoT.',
    checks: [{ key: 'company_known', ok: true }],
}

test('the team adds a company logo while checking an offer, and only images it accepts are sent', async ({ page }) => {
    let logos: unknown[] = []
    const seen = await mockServices(page, {
        'GET /job/admin/jobs': {
            items: [
                {
                    id: REVIEW.id,
                    title: REVIEW.title,
                    company: REVIEW.company,
                    origin: 'manual',
                    review_status: 'pending',
                    closes_on: null,
                    created_at: '2026-11-25T09:00:00Z',
                },
            ],
            total: 1,
            page: 1,
            page_size: 50,
            counts: { pending: 1, hidden: 0, expired: 0 },
        },
        [`GET /job/admin/jobs/${REVIEW.id}`]: REVIEW,
        'GET /job/public/logos': () => ({ items: logos }),
        'PUT /job/admin/logos': () => {
            logos = [{ company: 'Entreprise Beta', key: 'entreprise beta', version: 2, updated_at: '2026-11-25T21:00:00Z' }]
            return logos[0]
        },
        'GET /job/public/logos/entreprise%20beta': LOGO,
    })
    await signIn(page, ADMIN)
    await page.goto(`/admin/jobs`)
    await expect(page.getByText('Logo de l’entreprise')).toBeVisible()

    const input = page.locator('input[type="file"][accept*="image/png"]')
    await input.setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') })
    await expect(page.getByText('Choisis une image PNG, JPEG ou WebP.')).toBeVisible()
    expect(seen.some((r) => r.method === 'PUT')).toBe(false)

    await input.setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: LOGO })
    await expect(page.getByText('Logo de Entreprise Beta enregistré')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Changer le logo' })).toBeVisible()
    await expect(page.locator('img[src*="/public/logos/entreprise%20beta?v=2"]').first()).toBeVisible()
})
