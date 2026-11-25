import { expect, test } from '@playwright/test'
import { JOBS, STUDENT, mockServices, signIn } from './services'

test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{ name: 'NEXT_LOCALE', value: 'fr', url: 'http://localhost:3101' }])
})

test('the offers list opens an offer in the side panel', async ({ page }) => {
    await mockServices(page, {
        [`GET /job/jobs/${JOBS[1].id}`]: { ...JOBS[1], description: 'Capteurs, MQTT et tableau de bord.', book: null, created_at: '', updated_at: '' },
    })
    await signIn(page, STUDENT)
    await expect(page.getByRole('heading', { name: JOBS[0].title })).toBeVisible()
    await page.getByText(JOBS[1].title).first().click()
    const panel = page.getByRole('complementary')
    await expect(panel.getByRole('heading', { name: JOBS[1].title })).toBeVisible()
    await expect(panel.getByText('Capteurs, MQTT et tableau de bord.')).toBeVisible()
})

test('the AI analysis is asked on the button, once, and shown', async ({ page }) => {
    let asked = 0
    const seen = await mockServices(page, {
        'POST /email/applications/match': () => {
            asked += 1
            return {
                score: 72,
                level: 'good',
                strengths: ['Tu as utilisé React en projet.'],
                gaps: ['Ton CV ne montre pas Go.'],
                advice: 'Mets en avant ton projet React.',
                created_at: new Date().toISOString(),
                limit: 5,
                used: 1,
            }
        },
    })
    await signIn(page, STUDENT)
    const panel = page.getByRole('complementary')
    await expect(panel.getByRole('heading', { name: 'Analyse de l’IA' })).toBeVisible()
    expect(asked).toBe(0)
    await panel.getByRole('button', { name: 'Analyser avec l’IA' }).click()
    await expect(panel.getByText('72/100')).toBeVisible()
    await expect(panel.getByText('Bon match')).toBeVisible()
    await expect(panel.getByText('Ton CV ne montre pas Go.')).toBeVisible()
    await expect(panel.getByText(/encore 4 analyses ce mois-ci/)).toBeVisible()
    expect(asked).toBe(1)
    const sent = seen.find((r) => r.method === 'POST' && r.path === '/email/applications/match')
    expect(sent?.body).toEqual({ job_id: JOBS[0].id, resume_id: expect.any(String), language: 'fr' })
})

test('without analyses in the plan, the panel says so and points to the plans', async ({ page }) => {
    await mockServices(page, {
        'POST /email/applications/match': [402, { error: 'the AI analysis of offers is part of the subscription' }],
    })
    await signIn(page, STUDENT)
    const panel = page.getByRole('complementary')
    await panel.getByRole('button', { name: 'Analyser avec l’IA' }).click()
    await expect(panel.getByRole('alert')).toContainText('L’analyse par l’IA fait partie de l’abonnement.')
    await expect(panel.getByRole('link', { name: 'Voir les abonnements' })).toHaveAttribute('href', '/billing')
})
