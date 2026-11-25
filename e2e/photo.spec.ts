import { expect, test } from '@playwright/test'
import { RESUME, RESUME_ID, STUDENT, mockServices, signIn } from './services'

// A 1×1 PNG: enough for the page to show a photo.
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const ME = { id: STUDENT.id, name: 'Prénom Nom', email: STUDENT.email, role: 'candidate', status: 'active', school: 'ENIS', language: 'fr' }

test('the student adds a profile photo, sees it in the header, then removes it', async ({ page }) => {
    let has = false
    const seen = await mockServices(page, {
        'GET /account/users/me': () => ({ ...ME, has_photo: has }),
        'PUT /account/users/me/photo': () => {
            has = true
            return { has_photo: true }
        },
        'GET /account/users/me/photo': () => (has ? PIXEL : [404, { error: 'no profile photo' }]),
        'DELETE /account/users/me/photo': () => {
            has = false
            return { has_photo: false }
        },
    })
    await signIn(page, STUDENT)
    await page.goto('/settings')
    await expect(page.getByText('Photo nette, de face, JPG ou PNG, 5 Mo maximum. Facultative.')).toBeVisible()

    const file = page.locator('input[type="file"]')
    await file.setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') })
    await expect(page.getByText('Choisis une photo JPG ou PNG.')).toBeVisible()
    expect(seen.filter((r) => r.path === '/account/users/me/photo' && r.method === 'PUT')).toHaveLength(0)

    await file.setInputFiles({ name: 'moi.png', mimeType: 'image/png', buffer: PIXEL })
    await expect(page.getByText('Photo enregistrée')).toBeVisible()
    await expect(page.getByAltText('Ta photo de profil')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mon compte' }).locator('img')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Changer' })).toBeVisible()

    await page.getByRole('button', { name: 'Retirer' }).click()
    await expect(page.getByText('Photo retirée')).toBeVisible()
    await expect(page.getByAltText('Ta photo de profil')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Ajouter une photo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mon compte' }).locator('img')).toHaveCount(0)
})

test('a CV without a photo can take the profile photo', async ({ page }) => {
    let cvHas = false
    const seen = await mockServices(page, {
        'GET /account/users/me': { ...ME, has_photo: true },
        'GET /account/users/me/photo': PIXEL,
        [`GET /resume/resumes/${RESUME_ID}`]: () => ({ ...RESUME, has_photo: cvHas }),
        [`PUT /resume/resumes/${RESUME_ID}/photo`]: () => {
            cvHas = true
            return {}
        },
        [`GET /resume/resumes/${RESUME_ID}/photo`]: () => (cvHas ? PIXEL : [404, { error: 'no photo' }]),
    })
    await signIn(page, STUDENT)
    await page.goto(`/resumes/${RESUME_ID}?section=contact`)
    await page.getByRole('button', { name: 'Utiliser ma photo de profil' }).click()
    await expect(page.getByText('Photo enregistrée')).toBeVisible()
    expect(seen.some((r) => r.method === 'PUT' && r.path === `/resume/resumes/${RESUME_ID}/photo`)).toBe(true)
    await expect(page.getByRole('button', { name: 'Utiliser ma photo de profil' })).toHaveCount(0)
})
