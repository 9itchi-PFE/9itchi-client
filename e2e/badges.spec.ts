import { expect, test } from '@playwright/test'
import { ADMIN, STUDENT, mockServices, signIn } from './services'

const plan = { id: 'p1', name: 'pfe', price: 35, duration_days: 90, active: true, quotas: {}, details: { fr: { label: 'Saison PFE' } } }
const paid = {
    'GET /payments/subscriptions/me': {
        subscription: {
            id: 's1',
            plan_id: 'p1',
            status: 'active',
            amount: 35000,
            starts_at: '2026-11-01T00:00:00Z',
            ends_at: '2027-02-01T00:00:00Z',
            renews: false,
            stopped_at: null,
        },
        plan,
        is_free: false,
    },
}
const free = { 'GET /payments/subscriptions/me': { subscription: null, plan, is_free: true } }

test('an unread support message shows on the avatar and on Support, and the tab title', async ({ page }) => {
    await mockServices(page, { ...free, 'GET /chat/user/global-unread-count': { unread_count: 3 } })
    await signIn(page, STUDENT)
    await expect(page.getByTestId('attention-dot')).toBeVisible()
    await expect(page).toHaveTitle(/^\(3\) /)
    await page.getByRole('button', { name: 'Mon compte, nouveautés en attente' }).click()
    await expect(page.getByRole('menuitem', { name: /Aide/ }).getByRole('img', { name: '3 nouveaux messages' })).toBeVisible()
})

test('no unread message, no badge', async ({ page }) => {
    await mockServices(page, { ...free, 'GET /chat/user/global-unread-count': { unread_count: 0 } })
    await signIn(page, STUDENT)
    await expect(page.getByRole('button', { name: 'Mon compte' })).toBeVisible()
    await expect(page.getByTestId('attention-dot')).toHaveCount(0)
})

test('a subscriber sees Premium in settings and a free student does not', async ({ page }) => {
    await mockServices(page, paid)
    await signIn(page, STUDENT)
    await page.goto('/settings')
    await expect(page.getByTitle('Saison PFE').getByText('Premium')).toBeVisible()
})

test('a free student has no Premium badge', async ({ page }) => {
    await mockServices(page, free)
    await signIn(page, STUDENT)
    await page.goto('/settings')
    await expect(page.getByLabel('Spécialité')).toBeVisible()
    await expect(page.getByText('Premium')).toHaveCount(0)
})

test('the team sees the unread count on Support', async ({ page }) => {
    await mockServices(page, {
        'GET /account/users/me': { id: ADMIN.id, name: 'Équipe', email: ADMIN.email, role: 'admin', status: 'active', language: 'fr' },
        'GET /chat/user/global-unread-count': { unread_count: 12 },
    })
    await signIn(page, ADMIN)
    await expect(page.getByRole('link', { name: /Support/ }).getByRole('img', { name: '12 nouveaux messages' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Support/ })).toContainText('9+')
})
