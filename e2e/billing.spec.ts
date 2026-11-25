import { expect, test } from '@playwright/test'
import { STUDENT, mockServices, signIn, type Answers } from './services'

const FREE = { id: 'p-free', name: 'Free', price: 0, duration_days: 36500, quotas: {}, active: true }
const MONTH = { id: 'p-month', name: 'Abonnement étudiant', price: 35, duration_days: 30, quotas: {}, active: true }
const SEE_RECEIPT = /reçu/i
const PAYMENT_ID = '0e2e0000-0000-4000-8000-0000000000f1'

const payment = (status: 'completed' | 'failed' | 'pending', amount = 35000) => ({
    id: PAYMENT_ID,
    status,
    receipt_no: status === 'completed' ? '2026-000123' : '',
    plan_id: MONTH.id,
    plan_name: MONTH.name,
    duration_days: 30,
    amount_millimes: amount,
    discount_millimes: 35000 - amount,
    promo_code: amount < 35000 ? 'CLUB10' : '',
    provider: 'flouci',
    provider_ref: 'flouci-ref-1',
    period_start: new Date().toISOString(),
    period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
})

const free = (more: Answers = {}): Answers => ({
    'GET /payments/plans': { items: [FREE, MONTH] },
    'GET /payments/subscriptions/me': { subscription: null, plan: FREE, is_free: true },
    'GET /payments/payments': { items: [] },
    ...more,
})

test('a student pays on Flouci with a promo code, and comes back subscribed', async ({ page }) => {
    const seen = await mockServices(
        page,
        free({
            'POST /payments/promo-codes/validate': { valid: true, discount_amount: 3.5, final_price: 31.5 },
            'POST /payments/subscriptions/checkout': { payment_url: 'https://flouci.test/pay/abc', payment_id: PAYMENT_ID },
            [`POST /payments/payments/${PAYMENT_ID}/verify`]: payment('completed', 31500),
        }),
    )
    // Flouci itself is not called: its page is a stand-in that sends the browser back the way Flouci does.
    await page.route('https://flouci.test/**', (r) =>
        r.fulfill({
            contentType: 'text/html',
            body: `<h1>Flouci (simulé)</h1><a href="http://localhost:3101/settings/billing?payment=success&id=${PAYMENT_ID}">Payer</a>`,
        }),
    )
    await signIn(page, STUDENT)
    await page.goto('/settings/billing')
    await page.getByLabel('Code promo (école, club ou ami)').fill('club10')
    await page.getByRole('button', { name: 'Appliquer' }).click()
    await expect(page.getByText(/Code CLUB10 appliqué/)).toBeVisible()
    await page.getByRole('button', { name: /Payer sur Flouci/ }).click()
    await expect(page).toHaveURL('https://flouci.test/pay/abc')
    expect(seen.find((r) => r.path === '/payments/subscriptions/checkout')?.body).toEqual({ plan_id: MONTH.id, promo_code: 'CLUB10' })

    await page.getByRole('link', { name: 'Payer' }).click()
    await expect(page.getByRole('heading', { name: 'C’est bon, tu es abonné' })).toBeVisible()
    await expect(page.getByRole('link', { name: SEE_RECEIPT })).toHaveAttribute('href', `/settings/billing/receipts/${PAYMENT_ID}`)
})

test('a payment refused by Flouci says nothing was charged and offers to try again', async ({ page }) => {
    await mockServices(page, free({ [`POST /payments/payments/${PAYMENT_ID}/verify`]: payment('failed') }))
    await signIn(page, STUDENT)
    await page.goto(`/settings/billing?payment=failed&id=${PAYMENT_ID}`)
    await expect(page.getByRole('heading', { name: 'Le paiement n’est pas passé' })).toBeVisible()
    await expect(page.getByText(/Tu n’as pas été débité/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Réessayer/ })).toBeVisible()
})

test('a code that does not exist is refused before going to Flouci', async ({ page }) => {
    const seen = await mockServices(
        page,
        free({ 'POST /payments/promo-codes/validate': { valid: false, discount_amount: 0, final_price: 35, reason: 'not found' } }),
    )
    await signIn(page, STUDENT)
    await page.goto('/settings/billing')
    await page.getByLabel('Code promo (école, club ou ami)').fill('FAUX')
    await page.getByRole('button', { name: 'Appliquer' }).click()
    await expect(page.getByText('Ce code n’existe pas. Vérifie l’orthographe.')).toBeVisible()
    expect(seen.filter((r) => r.path === '/payments/subscriptions/checkout')).toHaveLength(0)
})
