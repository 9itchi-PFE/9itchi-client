import { expect, test } from '@playwright/test'
import { ADMIN, STUDENT, mockServices, signIn } from './services'

test('a wrong password says so and keeps the student on the sign-in page', async ({ page }) => {
    await mockServices(page)
    await signIn(page, { email: STUDENT.email, password: 'pas-le-bon' }, { fails: true })
    await expect(page.getByText('Email ou mot de passe incorrect.')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/signin/)
})

test('a student with a CV lands on the offers', async ({ page }) => {
    await mockServices(page)
    await signIn(page, STUDENT)
    await expect(page).toHaveURL(/\/jobs$/)
    await expect(page.getByRole('heading', { name: 'Trouve ton PFE' })).toBeVisible()
})

test('a student without a CV is sent to import one', async ({ page }) => {
    await mockServices(page, { 'GET /resume/resumes': { items: [], total: 0, page: 1, page_size: 100 } })
    await signIn(page, STUDENT)
    await expect(page).toHaveURL(/\/resumes\/upload$/)
})

test('a page asked for before signing in opens after it', async ({ page }) => {
    await mockServices(page)
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/auth\/signin\?/)
    await page.getByLabel('Email').fill(STUDENT.email)
    await page.getByLabel('Mot de passe').fill(STUDENT.password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL(/\/settings$/, { timeout: 45_000 })
})

test('the team lands on the admin overview', async ({ page }) => {
    await mockServices(page)
    await signIn(page, ADMIN)
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible()
})

test('a student who opens the admin is sent back to the offers', async ({ page }) => {
    await mockServices(page)
    await signIn(page, STUDENT)
    await expect(page).toHaveURL(/\/jobs$/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/jobs$/)
})
