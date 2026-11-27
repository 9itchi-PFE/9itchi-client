import { expect, test } from '@playwright/test'
import { JOBS, STUDENT, mockServices, signIn } from './services'

const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const APP_ID = '0e2e0000-0000-4000-8000-0000000000d1'

const gmailApp = (over: Record<string, unknown> = {}) => ({
    id: APP_ID,
    job_id: JOBS[0].id,
    email_id: 'e1',
    status: 'sent',
    job_title: JOBS[0].title,
    company: JOBS[0].company,
    via: 'gmail',
    email: { id: 'e1', recipient: 'rh@alpha.tn', subject: 'Candidature', status: 'sent', scheduled_at: null, sent_at: days(9) },
    follow_up_sent_at: null,
    created_at: days(9),
    updated_at: days(9),
    ...over,
})
const other = {
    ...gmailApp(),
    id: '0e2e0000-0000-4000-8000-0000000000d2',
    job_id: JOBS[1].id,
    job_title: JOBS[1].title,
    company: JOBS[1].company,
    status: 'replied',
    email: { id: 'e2', recipient: 'rh@beta.tn', subject: 'Candidature', status: 'sent', scheduled_at: null, sent_at: days(3) },
    created_at: days(3),
}

test('the overview counts the results, and a week without an answer gets an AI follow-up sent from Gmail', async ({ page }) => {
    let followed = false
    const seen = await mockServices(page, {
        'GET /email/applications': () => ({ items: [gmailApp(followed ? { follow_up_sent_at: new Date().toISOString() } : {}), other] }),
        'GET /tracker/emails/e1/stats': { first_open_at: days(8) },
        'GET /tracker/emails/e2/stats': { first_open_at: days(2) },
        [`POST /email/applications/${APP_ID}/follow-up/draft`]: { subject: 'Re: Candidature', body: 'Bonjour, je reviens vers vous.', limit: null, used: 1 },
        [`POST /email/applications/${APP_ID}/follow-up`]: () => {
            followed = true
            return gmailApp({ follow_up_sent_at: new Date().toISOString() })
        },
    })
    await signIn(page, STUDENT)
    await page.goto('/applications')

    const overview = page.getByRole('region', { name: 'Tes résultats' })
    await expect(overview.getByText('Envoyées', { exact: true })).toBeVisible()
    await expect(overview.getByText('100 % des envois Gmail')).toBeVisible()
    await expect(overview.getByText('50 % de tes candidatures')).toBeVisible()
    await expect(overview.getByText('Sans réponse depuis 7 jours')).toBeVisible()

    await page.getByRole('button', { name: 'Préparer la relance' }).click()
    const dialog = page.getByRole('dialog', { name: `Relance pour ${JOBS[0].company}` })
    await expect(dialog.getByText('À : rh@alpha.tn (la même adresse que ta candidature)')).toBeVisible()
    await expect(dialog.getByLabel('Objet')).toHaveValue('Re: Candidature')
    await dialog.getByLabel('Message').fill('Bonjour, je me permets de revenir vers vous.')
    await dialog.getByRole('button', { name: 'Envoyer la relance' }).click()
    await expect(dialog).toBeHidden()
    const sent = seen.find((r) => r.method === 'POST' && r.path === `/email/applications/${APP_ID}/follow-up`)?.body
    expect(sent).toEqual({ subject: 'Re: Candidature', body: 'Bonjour, je me permets de revenir vers vous.' })
    await expect(page.getByText(/Relance envoyée le/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Préparer la relance' })).toHaveCount(0)
})

test('without a subscription the follow-up shows the plan instead of an error', async ({ page }) => {
    await mockServices(page, {
        'GET /email/applications': { items: [gmailApp()] },
        [`POST /email/applications/${APP_ID}/follow-up/draft`]: [402, { error: 'the AI letter is part of the subscription' }],
    })
    await signIn(page, STUDENT)
    await page.goto('/applications')
    await page.getByRole('button', { name: 'Préparer la relance' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('La relance depuis Gmail fait partie de l’abonnement')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Voir l’abonnement' })).toHaveAttribute('href', '/settings/billing')
})

test('an application sent by the student gets a follow-up to copy', async ({ page }) => {
    await mockServices(page, {
        'GET /email/applications': { items: [gmailApp({ via: 'self', email_id: null, email: null })] },
        [`POST /email/applications/${APP_ID}/follow-up/draft`]: { subject: 'Relance', body: 'Bonjour', limit: null, used: 1 },
    })
    await signIn(page, STUDENT)
    await page.goto('/applications')
    await page.getByRole('button', { name: 'Préparer la relance' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/copie la relance et envoie-la/)).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Copier la relance' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Envoyer la relance' })).toHaveCount(0)
})
