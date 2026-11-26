import { expect, test } from '@playwright/test'
import { RESUME, RESUME_ID, STUDENT, mockServices, signIn } from './services'

const RESUME_WITH_JOB = {
    ...RESUME,
    content: {
        ...RESUME.content,
        experience: [{ title: 'Développeur web', company: 'Entreprise Alpha', location: 'Sfax', start: '2025', end: '2026', kind: '', description: [] }],
    },
}

test('the student chooses how the job title and the company sit, and it is saved with the CV', async ({ page }) => {
    const seen = await mockServices(page, {
        [`GET /resume/resumes/${RESUME_ID}`]: RESUME_WITH_JOB,
        [`PUT /resume/resumes/${RESUME_ID}`]: RESUME_WITH_JOB,
    })
    await signIn(page, STUDENT)
    await page.goto(`/resumes/${RESUME_ID}`)
    await page.getByRole('tab', { name: 'Personnaliser' }).click()
    await page.getByRole('tablist', { name: 'Catégories de personnalisation' }).getByRole('tab', { name: 'Entrées' }).click()

    const panel = page.getByTestId('style-panel')
    await panel.getByRole('radio', { name: 'Sur la même ligne' }).click()
    await panel.getByRole('radio', { name: "Entreprise / école d'abord" }).click()
    await panel.screenshot({ path: 'test-results/style-panel-entries.png' })

    // Same line, company first: one row reads « Entreprise Alpha — Développeur web ».
    const preview = page.getByLabel('Aperçu du CV').first()
    await expect(preview.getByText('Entreprise Alpha — Développeur web')).toBeVisible()

    await expect
        .poll(
            () =>
                seen
                    .filter((r) => r.method === 'PUT' && r.path === `/resume/resumes/${RESUME_ID}`)
                    .map((r) => JSON.stringify(r.body))
                    .join(''),
            { timeout: 15_000 },
        )
        .toContain('"entry_layout":"inline"')
    expect(JSON.stringify(seen.filter((r) => r.method === 'PUT').at(-1)?.body)).toContain('"entry_order":"subtitle_first"')

    // One above the other, title first.
    await panel.getByRole('radio', { name: 'Sur deux lignes' }).click()
    await panel.getByRole('radio', { name: "Intitulé d'abord" }).click()
    await expect(preview.getByText('Développeur web', { exact: true })).toBeVisible()
    await expect(preview.getByText('Entreprise Alpha', { exact: true })).toBeVisible()
})
