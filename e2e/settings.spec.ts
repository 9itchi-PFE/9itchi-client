import { expect, test, type Request } from '@playwright/test'
import { STUDENT, mockServices, signIn } from './services'

test('the profile is saved with what the student typed, and a wrong link is caught first', async ({ page }) => {
    const seen = await mockServices(page, {
        'PUT /account/users/me': (req: Request) => ({
            id: STUDENT.id,
            email: STUDENT.email,
            role: 'candidate',
            status: 'active',
            language: 'fr',
            ...req.postDataJSON(),
        }),
    })
    await signIn(page, STUDENT)
    await page.goto('/settings')
    await page.getByLabel('Spécialité').fill('Génie logiciel')
    await page.getByLabel('Ville').fill('Sfax')
    await page.getByLabel('Téléphone').fill('+216 20 000 000')
    await page.getByLabel('LinkedIn').fill('linkedin.com/company/acme')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByText(/Colle l’adresse de ton profil LinkedIn/)).toBeVisible()
    expect(seen.filter((r) => r.method === 'PUT')).toHaveLength(0)

    await page.getByLabel('LinkedIn').fill('linkedin.com/in/prenom-nom')
    // The drop-down is driven from the keyboard: letters jump to a school, Enter chooses it, and the form sends its value.
    const school = page.getByRole('combobox', { name: /École/ })
    await school.focus()
    await page.keyboard.type('ENSI')
    await page.keyboard.press('Enter')
    await expect(school).toContainText('ENSI')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByText('Profil enregistré')).toBeVisible()
    const put = seen.find((r) => r.method === 'PUT' && r.path === '/account/users/me')
    expect(put?.body).toMatchObject({ speciality: 'Génie logiciel', city: 'Sfax', phone: '+21620000000', linkedin: 'linkedin.com/in/prenom-nom', school: 'ENSI' })
})
