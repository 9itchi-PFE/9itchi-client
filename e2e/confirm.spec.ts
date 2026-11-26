import { expect, test } from '@playwright/test'
import { STUDENT, mockServices, signIn } from './services'

test('signing out from the account menu asks first, and nothing happens on Annuler', async ({ page }) => {
    await mockServices(page, {})
    await signIn(page, STUDENT)
    await page.goto('/settings')
    await page.getByRole('button', { name: /^Mon compte/ }).click()
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click()
    const dialog = page.getByRole('dialog', { name: 'Te déconnecter ?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Annuler' }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/settings$/)
})

const MONTH = { id: 'p-month', name: 'Abonnement étudiant', price: 35, duration_days: 30, quotas: {}, active: true }
const SUB = {
    id: 's1',
    plan_id: MONTH.id,
    promo_code_id: null,
    status: 'active',
    amount: 35,
    starts_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    ends_at: new Date(Date.now() + 20 * 86_400_000).toISOString(),
    renews: true,
    stopped_at: null,
}

test('stopping the subscription asks in a dialog, and keeping it sends nothing', async ({ page }) => {
    const me = { subscription: SUB, plan: MONTH, is_free: false, kept_price: null }
    const seen = await mockServices(page, {
        'GET /payments/plans': { items: [MONTH] },
        'GET /payments/subscriptions/me': me,
        'GET /payments/payments': { items: [] },
        'POST /payments/subscriptions/cancel': { ...me, subscription: { ...SUB, renews: false } },
    })
    await signIn(page, STUDENT)
    await page.goto('/settings/billing')
    await page.getByRole('button', { name: 'Arrêter l’abonnement' }).click()
    const dialog = page.getByRole('dialog', { name: 'Arrêter ton abonnement ?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Garder mon abonnement' }).click()
    await expect(dialog).toBeHidden()
    expect(seen.some((r) => r.path === '/payments/subscriptions/cancel')).toBe(false)

    await page.getByRole('button', { name: 'Arrêter l’abonnement' }).click()
    await dialog.getByRole('button', { name: 'Oui, arrêter' }).click()
    await expect(dialog).toBeHidden()
    expect(seen.some((r) => r.method === 'POST' && r.path === '/payments/subscriptions/cancel')).toBe(true)
})
