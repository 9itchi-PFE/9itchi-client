import { expect, test } from '@playwright/test'
import { STUDENT, mockServices, signIn } from './services'

test('Arabic turns the whole interface right to left', async ({ page, context }) => {
    await mockServices(page)
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'ar', url: 'http://localhost:3101' }])
    await page.goto('/auth/signin')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
})

test('English keeps the student signed in and changes the words', async ({ page, context }) => {
    await mockServices(page)
    await signIn(page, STUDENT)
    await expect(page).toHaveURL(/\/jobs$/)
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3101' }])
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page).toHaveURL(/\/jobs$/)
})

test('the language menu offers French and English only', async ({ page }) => {
    await mockServices(page)
    await signIn(page, STUDENT)
    const menu = page.getByLabel('Langue').first()
    await expect(menu.locator('option')).toHaveText(['FR', 'EN'])
})
