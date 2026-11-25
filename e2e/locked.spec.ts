import { expect, test } from '@playwright/test'
import { RESUME, RESUME_ID, STUDENT, mockServices, signIn } from './services'

const OTHER_ID = '0e2e0000-0000-4000-8000-0000000000c2'

test('beyond the plan, the other CV is read-only until the student chooses it', async ({ page }) => {
    let editable = RESUME_ID
    const one = (id: string, title: string) => ({ ...RESUME, id, title, locked: id !== editable })
    const seen = await mockServices(page, {
        'GET /resume/resumes': () => ({
            items: [
                { ...one(RESUME_ID, 'CV web'), content: undefined },
                { ...one(OTHER_ID, 'CV data'), content: undefined, updated_at: '2026-11-21T09:00:00Z' },
            ],
            total: 2,
            page: 1,
            page_size: 100,
        }),
        [`GET /resume/resumes/${OTHER_ID}`]: () => one(OTHER_ID, 'CV data'),
        [`GET /resume/resumes/${RESUME_ID}`]: () => one(RESUME_ID, 'CV web'),
        [`POST /resume/resumes/${OTHER_ID}/ats-check`]: { passed: 24, total: 24, to_fix: 0, rules: [] },
        [`PUT /resume/resumes/${OTHER_ID}/editable`]: () => {
            editable = OTHER_ID
            return one(OTHER_ID, 'CV data')
        },
    })
    await signIn(page, STUDENT)
    await page.goto(`/resumes/${OTHER_ID}?section=contact`)
    await expect(page.getByText('Abonne-toi pour modifier tes autres versions')).toBeVisible()
    await expect(page.getByLabel('Nom complet')).toBeDisabled()
    await expect(page.getByRole('link', { name: 'Voir l’abonnement →' })).toHaveAttribute('href', '/settings/billing')

    // The download stays open.
    await expect(page.getByRole('button', { name: 'Télécharger' })).toBeEnabled()

    await page.getByRole('button', { name: 'Modifier celle-ci à la place' }).click()
    await expect(page.getByText('Tu modifies maintenant « CV data »')).toBeVisible()
    await expect(page.getByText('Abonne-toi pour modifier tes autres versions')).toHaveCount(0)
    expect(seen.some((r) => r.method === 'PUT' && r.path === `/resume/resumes/${OTHER_ID}/editable`)).toBe(true)
    expect(seen.some((r) => r.method === 'PUT' && r.path === `/resume/resumes/${OTHER_ID}`)).toBe(false)

    // The drawer lists both, the other one now read-only.
    await page
        .getByRole('button', { name: /versions/i })
        .first()
        .click()
    await expect(page.getByText('Lecture seule')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Modifier celle-ci à la place' })).toHaveCount(1)
})
