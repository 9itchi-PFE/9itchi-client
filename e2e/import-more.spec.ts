import { expect, test } from '@playwright/test'
import { RESUME, RESUME_ID, STUDENT, mockServices, signIn } from './services'

const NEW_ID = '0e2e0000-0000-4000-8000-0000000000c9'
const paid = (resumes: number) => ({
    subscription: null,
    plan: { id: 'p-month', name: 'Abonnement étudiant', price: 35, duration_days: 30, quotas: { resumes }, active: true },
    is_free: false,
})
const pdf = { name: 'mon-cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') }

test('a student with 1 CV and a quota of 3 imports a 2nd one from the drawer and lands on it', async ({ page }) => {
    const created = { ...RESUME, id: NEW_ID, title: 'Mon CV importé' }
    const seen = await mockServices(page, {
        'GET /payments/subscriptions/me': paid(3),
        'POST /resume/resumes/upload': { resume: created, file: { id: 'f1' } },
        [`GET /resume/resumes/${NEW_ID}`]: created,
        [`POST /resume/resumes/${NEW_ID}/ats-check`]: { passed: 24, total: 24, to_fix: 0, rules: [] },
    })
    await signIn(page, STUDENT)
    await page.goto(`/resumes/${RESUME_ID}`)
    await page
        .getByRole('button', { name: /versions/i })
        .first()
        .click()
    await expect(page.getByText('1 / 3 CV')).toBeVisible()
    await page.getByRole('button', { name: 'Importer un CV' }).click()
    await expect(page).toHaveURL(/\/resumes\/import$/)
    await page.locator('input[type=file]').setInputFiles(pdf)
    await expect(page).toHaveURL(new RegExp(`/resumes/${NEW_ID}$`))
    expect(seen.some((r) => r.method === 'POST' && r.path === '/resume/resumes/upload')).toBe(true)
    expect(seen.some((r) => r.method === 'DELETE')).toBe(false)
})

test('with the quota reached, the drawer points to the subscription instead of importing', async ({ page }) => {
    await mockServices(page, {
        'GET /payments/subscriptions/me': paid(1),
    })
    await signIn(page, STUDENT)
    await page.goto(`/resumes/${RESUME_ID}`)
    await page
        .getByRole('button', { name: /versions/i })
        .first()
        .click()
    await expect(page.getByText('1 / 1 CV')).toBeVisible()
    await expect(page.getByText('Tu as atteint la limite de 1 CV de ton offre', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Importer un CV' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Voir l’abonnement →' }).first()).toHaveAttribute('href', '/settings/billing')
})

test('a 402 on upload shows the limit and the way to the subscription', async ({ page }) => {
    await mockServices(page, {
        'GET /payments/subscriptions/me': paid(3),
        'POST /resume/resumes/upload': [402, { error: 'CV limit of your plan reached' }],
    })
    await signIn(page, STUDENT)
    await page.goto('/resumes/import')
    await page.locator('input[type=file]').setInputFiles(pdf)
    await expect(page.getByRole('alert').filter({ hasText: 'limite de' })).toContainText('limite de')
    await expect(page.getByRole('alert').filter({ hasText: 'limite de' }).getByRole('link', { name: 'Voir l’abonnement →' })).toHaveAttribute(
        'href',
        '/settings/billing',
    )
})
