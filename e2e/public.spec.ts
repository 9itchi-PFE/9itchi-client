import { expect, test } from '@playwright/test'
import { JOBS, STUDENT, mockServices, signIn } from './services'

const OFFER = JOBS[0].id
const PUBLIC = {
    id: OFFER,
    title: 'Portail web des marchands',
    company: 'Entreprise Alpha',
    location: 'Sfax',
    contract_type: 'internship',
    source: 'tanitjobs',
    description: 'Un portail pour suivre les ventes des marchands.',
    stipend_tnd: 800,
    duration_months: 6,
    work_mode: 'hybrid',
    closes_on: '2099-12-01',
    starts_on: '2027-02-01',
    skills: ['React', 'Go'],
    pair_ok: false,
    easy_apply: true,
    topic: null,
    book_company: '',
    book_title: '',
    closed: false,
}
const PLANS = {
    items: [
        { id: 'p-free', name: 'Free', price: 0, duration_days: 36500, quotas: {}, active: true },
        { id: 'p-month', name: 'Abonnement étudiant', price: 35, regular_price: 50, duration_days: 30, quotas: {}, active: true },
    ],
}

test('the home page shows what 9itchi does and the real prices, without an account', async ({ page }) => {
    await mockServices(page, { 'GET /payments/plans': PLANS })
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: /Trouve ton PFE/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Comment ça marche' })).toBeVisible()
    await expect(page.getByText('35 DT', { exact: true })).toBeVisible()
    await expect(page.getByText('50 DT', { exact: true })).toBeVisible()
    await expect(page.getByText(/gardé tant que tu renouvelles/)).toBeVisible()
    await expect(page.getByText('5 candidatures avec le CV que tu as importé, et 1 lettre par l’IA par mois')).toBeVisible()
    await page.getByRole('link', { name: 'Créer mon compte' }).first().click()
    await expect(page).toHaveURL(/\/auth\/signup$/)
})

test('a signed-in student going to the home page lands on the offers', async ({ page }) => {
    await mockServices(page)
    await signIn(page, STUDENT)
    await page.goto('/')
    await expect(page).toHaveURL(/\/jobs$/)
})

test('a shared offer opens without an account and leads back to it after signing in', async ({ page }) => {
    await mockServices(page, { [`GET /job/public/jobs/${OFFER}`]: PUBLIC })
    await page.goto(`/offres/${OFFER}`)
    await expect(page.getByRole('heading', { name: 'Portail web des marchands' })).toBeVisible()
    await expect(page.getByText('800 DT / mois')).toBeVisible()
    await expect(page.getByText('Offre publiée sur Tanitjobs. On cite toujours la source.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Crée ton compte pour postuler' })).toBeVisible()

    await page.getByRole('link', { name: 'Déjà un compte ? Se connecter' }).click()
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=/)
    await page.getByLabel('Email').fill(STUDENT.email)
    await page.getByLabel('Mot de passe').fill(STUDENT.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL(new RegExp(`/jobs/${OFFER}$`), { timeout: 45_000 })
})

test('a closed or unknown shared offer says so', async ({ page }) => {
    await mockServices(page, {
        [`GET /job/public/jobs/${OFFER}`]: { ...PUBLIC, closed: true },
        'GET /job/public/jobs/0e2e0000-0000-4000-8000-0000000000ff': [404, { error: 'job not found' }],
    })
    await page.goto(`/offres/${OFFER}`)
    await expect(page.getByText('Offre fermée')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cette offre est fermée' })).toBeVisible()

    await page.goto('/offres/0e2e0000-0000-4000-8000-0000000000ff')
    await expect(page.getByRole('heading', { name: 'Cette offre n’existe pas ou n’est plus en ligne' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Découvrir 9itchi PFE' })).toHaveAttribute('href', '/')
})

test('a signed-in student opening a shared link sees the offer inside 9itchi, and can copy the link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await mockServices(page)
    await signIn(page, STUDENT)
    await page.goto(`/offres/${OFFER}`)
    await expect(page).toHaveURL(new RegExp(`/jobs/${OFFER}$`))
    await page.getByRole('button', { name: 'Copier le lien' }).first().click()
    await expect(page.getByText('Lien de l’offre copié : tu peux le partager')).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`/offres/${OFFER}$`))
})
