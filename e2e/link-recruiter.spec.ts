import { expect, test } from '@playwright/test'
import { RECRUITERS, STUDENT, mockServices, signIn } from './services'

test('the link page finds the recruiter of the offer’s company on the button and fills the address', async ({ page }) => {
    const seen = await mockServices(page)
    await signIn(page, STUDENT)
    await page.goto('/outreach/link')
    await page.getByLabel('Lien de l’offre').fill('https://exemple.tn/offres/42')
    await page.getByRole('button', { name: 'Écrire mon e-mail' }).click()

    await expect(page.getByText('Recruteur chez Entreprise Alpha')).toBeVisible()
    expect(seen.some((r) => r.path === '/email/recruiters/company')).toBe(false)
    await page.getByRole('button', { name: 'Trouver le recruteur' }).click()
    await expect(page.getByText(RECRUITERS[0].email)).toBeVisible()
    const ask = seen.find((r) => r.path === '/email/recruiters/company')
    expect(ask?.body).toEqual({ company: 'Entreprise Alpha', goal: 'Stage PFE' })

    await page.getByRole('button', { name: 'Utiliser cette adresse' }).click()
    await expect(page.getByPlaceholder('nom@entreprise.tn')).toHaveValue(RECRUITERS[0].email)
    await expect(page.getByRole('link', { name: 'Voir dans le Radar recruteurs' })).toHaveAttribute('href', '/outreach')
})

test('nobody at the company says the search was not counted', async ({ page }) => {
    await mockServices(page, { 'POST /email/recruiters/company': [404, { error: 'no recruiter found at this company' }] })
    await signIn(page, STUDENT)
    await page.goto('/outreach/link')
    await page.getByLabel('Lien de l’offre').fill('https://exemple.tn/offres/42')
    await page.getByRole('button', { name: 'Écrire mon e-mail' }).click()
    await page.getByRole('button', { name: 'Trouver le recruteur' }).click()
    await expect(page.getByText('Personne n’a été trouvé dans cette entreprise. Aucune recherche n’a été comptée.')).toBeVisible()
})
