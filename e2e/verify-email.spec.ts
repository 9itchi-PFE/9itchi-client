import { expect, test } from '@playwright/test'
import { mockServices } from './services'

// Invented account, the one e2e/mock-account.mjs keeps unverified (login answers 403 email not verified).
const NEW = { email: 'nouveau@exemple.tn', password: 'MotDePasse123', id: '0e2e0000-0000-4000-8000-000000000003' }
const verified = {
    user: { id: NEW.id, name: 'Nouvel Étudiant', email: NEW.email, role: 'candidate', status: 'active' },
    access_token: 'e2e-access-verified',
    refresh_token: 'e2e-refresh-verified',
}

test('a new account enters its emailed code, then starts with its CV', async ({ page }) => {
    const seen = await mockServices(page, {
        'POST /account/auth/signup': [201, { email: NEW.email, verification_required: true }],
        'POST /account/auth/verify-email': (req) =>
            (req.postDataJSON() as { code: string }).code === '123456' ? verified : [400, { error: 'invalid or expired code' }],
        'GET /account/users/me': verified.user,
        'GET /resume/resumes': { items: [], total: 0, page: 1, page_size: 100 },
    })
    await page.goto('/auth/signup')
    await page.getByLabel('Prénom et nom').fill('Nouvel Étudiant')
    await page.getByLabel('Email').fill(NEW.email)
    await page.getByLabel('Mot de passe').fill(NEW.password)
    await page.getByRole('button', { name: 'Créer mon compte' }).click()

    await expect(page).toHaveURL(/\/auth\/verify-email\?/, { timeout: 45_000 })
    await expect(page.getByRole('heading', { name: 'Confirme ton email' })).toBeVisible()
    await expect(page.getByText(NEW.email, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Renvoyer le code dans/ })).toBeDisabled()

    await page.getByLabel('Code à 6 chiffres').fill('000000')
    await page.getByRole('button', { name: 'Activer mon compte' }).click()
    await expect(page.getByText('Ce code n’est pas valable ou a expiré.')).toBeVisible()

    await page.getByLabel('Code à 6 chiffres').fill('123456')
    await page.getByRole('button', { name: 'Activer mon compte' }).click()
    await expect(page).toHaveURL(/\/resumes\/upload$/, { timeout: 45_000 })
    expect(seen.filter((r) => r.path === '/account/auth/verify-email').map((r) => r.body)).toEqual([
        { email: NEW.email, code: '000000' },
        { email: NEW.email, code: '123456' },
    ])
})

test('signing in before the email is confirmed asks for the code', async ({ page }) => {
    await mockServices(page)
    await page.goto('/auth/signin')
    await page.getByLabel('Email').fill(NEW.email)
    await page.getByLabel('Mot de passe').fill(NEW.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL(/\/auth\/verify-email\?email=nouveau%40exemple\.tn/, { timeout: 45_000 })
    await expect(page.getByLabel('Email')).toHaveValue(NEW.email)
})

test('the code can be sent again once the minute has passed', async ({ page }) => {
    const seen = await mockServices(page, { 'POST /account/auth/resend-verification': { message: 'ok' } })
    // Without an email in the link there is nothing to wait for: the student types it.
    await page.goto('/auth/verify-email')
    await expect(page.getByText('Écris ton email et le code à 6 chiffres reçu pour activer ton compte.')).toBeVisible()
    await page.getByLabel('Email').fill(NEW.email)
    await page.getByRole('button', { name: 'Renvoyer le code' }).click()
    await expect(page.getByText('Un nouveau code vient de partir. Pense à regarder dans les spams.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Renvoyer le code dans/ })).toBeDisabled()
    expect(seen.filter((r) => r.path === '/account/auth/resend-verification').map((r) => r.body)).toEqual([{ email: NEW.email }])
})
