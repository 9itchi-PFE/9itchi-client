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
    await menu.click()
    await expect(page.getByRole('option')).toHaveText(['FR', 'EN'])
    await expect(page.getByRole('option', { name: 'FR' })).toHaveAttribute('aria-selected', 'true')
})

test('the language menu is a styled list that changes the language by keyboard and by click', async ({ page }) => {
    await mockServices(page)
    await signIn(page, STUDENT)
    const menu = page.getByLabel('Langue').first()
    await menu.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await menu.click()
    await page.getByRole('option', { name: 'EN' }).click()
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})
