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

test('the « Send to 9itchi » button sits under the link field and explains itself when clicked here', async ({ page }) => {
    await mockServices(page)
    await signIn(page, STUDENT)
    await page.goto('/outreach/link')
    const button = page.getByRole('link', { name: 'Envoyer à 9itchi' })
    await expect(button).toHaveAttribute('href', /^javascript:/)
    await expect(page.getByText(/Lues directement depuis le lien/)).toBeVisible()
    await button.click()
    await expect(page.getByRole('status').filter({ hasText: 'barre de favoris' })).toBeVisible()
    await expect(page).toHaveURL(/\/outreach\/link$/)
})

test('the « Send to 9itchi » button brings the link and the text, and the company can be typed', async ({ page }) => {
    const seen = await mockServices(page)
    await signIn(page, STUDENT)
    const text = 'Stage PFE data chez Entreprise Alpha à Tunis. Python, SQL et tableaux de bord pendant six mois.'
    await page.goto('/outreach/link#u=' + encodeURIComponent('https://www.linkedin.com/jobs/search/?currentJobId=42&keywords=data') + '&t=' + encodeURIComponent(text))

    await expect(page.getByLabel('Lien de l’offre')).toHaveValue('https://www.linkedin.com/jobs/view/42/')
    await expect(page.locator('textarea')).toHaveValue(text)
    await expect(page).toHaveURL(/\/outreach\/link$/)
    await page.getByRole('button', { name: 'Écrire mon e-mail' }).click()
    const draft = seen.find((r) => r.path === '/email/emails/draft-from-link')
    expect(draft?.body).toMatchObject({ url: 'https://www.linkedin.com/jobs/view/42/', offer_text: text })

    await page.getByLabel('Entreprise', { exact: true }).fill('Entreprise Beta')
    await page.getByRole('button', { name: 'Trouver le recruteur' }).click()
    await expect(page.getByText(RECRUITERS[0].email)).toBeVisible()
    expect(seen.find((r) => r.path === '/email/recruiters/company')?.body).toEqual({ company: 'Entreprise Beta', goal: 'Stage PFE' })
})
