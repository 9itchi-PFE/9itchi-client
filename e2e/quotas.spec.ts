import { expect, test } from '@playwright/test'
import { ADMIN, JOBS, RESUME, RESUME_ID, STUDENT, mockServices, signIn } from './services'

const withLine = {
    ...RESUME,
    content: {
        ...RESUME.content,
        experience: [{ company: 'Entreprise Gamma', title: 'Stage d’été', start: '2026', end: '2026', description: ['j’ai fait le portail en React'] }],
    },
}
const check = {
    passed: 23,
    total: 24,
    to_fix: 1,
    rules: [{ id: 'action_verbs', group: 'experience', status: 'fix', where: 'experience[0].description[0]', was: 'j’ai fait le portail en React' }],
}

test('the CV rewrite is asked on the button only, and a used month says so', async ({ page }) => {
    let asked = 0
    await mockServices(page, {
        [`GET /resume/resumes/${RESUME_ID}`]: withLine,
        [`POST /resume/resumes/${RESUME_ID}/ats-check`]: check,
        [`POST /resume/resumes/${RESUME_ID}/rewrite`]: () => {
            asked += 1
            return [402, { error: 'monthly limit of AI rewrites of your plan reached' }]
        },
    })
    await signIn(page, STUDENT)
    await page.goto(`/resumes/${RESUME_ID}/check`)
    await expect(page.getByText('j’ai fait le portail en React')).toBeVisible()
    await page.waitForTimeout(1000)
    expect(asked).toBe(0)
    await page.getByRole('button', { name: 'Proposer une version avec l’IA' }).click()
    await expect(page.getByText('Tu as utilisé les réécritures par l’IA de ce mois-ci.')).toBeVisible()
    expect(asked).toBe(1)
})

test('the CV rewrite proposes a line to use', async ({ page }) => {
    const seen = await mockServices(page, {
        [`GET /resume/resumes/${RESUME_ID}`]: withLine,
        [`POST /resume/resumes/${RESUME_ID}/ats-check`]: check,
        [`POST /resume/resumes/${RESUME_ID}/rewrite`]: { suggestions: ['Développé en React le portail des marchands.'], limit: 1, used: 1 },
    })
    await signIn(page, STUDENT)
    await page.goto(`/resumes/${RESUME_ID}/check`)
    await page.getByRole('button', { name: 'Proposer une version avec l’IA' }).click()
    await expect(page.getByText('Développé en React le portail des marchands.')).toBeVisible()
    expect(seen.find((r) => r.path.endsWith('/rewrite'))?.body).toEqual({ section: 'bullet', text: 'j’ai fait le portail en React', language: 'fr' })
})

test('without an AI letter left, the apply screen offers to write it and points to the plans', async ({ page }) => {
    const offer = JOBS[0]
    await mockServices(page, {
        [`GET /job/jobs/${offer.id}`]: { ...offer, description: 'Un portail.', book: null, created_at: '', updated_at: '' },
        'POST /email/emails/draft': [402, { error: 'monthly limit of AI letters of your plan reached' }],
        'GET /email/gmail/status': { connected: false },
    })
    await signIn(page, STUDENT)
    await page.goto(`/jobs/${offer.id}/apply`)
    await expect(page.getByRole('heading', { name: 'Ta lettre par l’IA de ce mois-ci est utilisée' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voir les abonnements' })).toHaveAttribute('href', '/settings/billing')
    await page.getByRole('link', { name: 'Voir les abonnements' }).click()
    await expect(page).toHaveURL(/\/settings\/billing$/)
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Ta lettre par l’IA de ce mois-ci est utilisée' })).toBeVisible()
    await page.getByRole('button', { name: 'L’écrire moi-même' }).click()
    await expect(page.getByRole('heading', { name: 'Ta lettre par l’IA de ce mois-ci est utilisée' })).toBeHidden()
})

test('the team sets the AI limits of each plan', async ({ page }) => {
    await mockServices(page, {
        'GET /payments/admin/plans': {
            items: [
                {
                    id: 'p-free',
                    name: 'Free',
                    price: 0,
                    duration_days: 36500,
                    active: true,
                    quotas: { ai_drafts_per_month: 1, ai_rewrites_per_month: 1, ai_matches_per_month: 3 },
                },
                { id: 'p-month', name: 'Mensuel', price: 35, duration_days: 30, active: true, quotas: {} },
            ],
        },
    })
    await signIn(page, ADMIN)
    await page.goto('/admin/plans')
    for (const label of ['Lettres écrites par l’IA, par mois', 'Réécritures du CV par l’IA, par mois', 'Analyses d’une offre par l’IA, par mois']) {
        await expect(page.getByRole('rowheader', { name: label })).toBeVisible()
    }
})
