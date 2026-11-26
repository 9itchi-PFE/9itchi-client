import { expect, test } from '@playwright/test'
import { STUDENT, mockServices, signIn } from './services'

const CONVERSATION = { id: 'c1', user_id: STUDENT.id, unread_count: 0, created_at: '2026-11-25T10:00:00Z', updated_at: '2026-11-25T10:00:00Z' }

test('an empty support chat shows the platform empty state, and a subject starts the message', async ({ page }) => {
    await mockServices(page, {
        'POST /chat/conversations': CONVERSATION,
        'GET /chat/conversations/c1/messages': { items: [], total: 0 },
    })
    await signIn(page, STUDENT)
    await page.goto('/support')
    await expect(page.getByRole('heading', { name: 'Écris-nous' })).toBeVisible()
    await page.getByRole('button', { name: 'Mon CV', exact: true }).click()
    await expect(page.getByPlaceholder('Écrire un message')).not.toHaveValue('')
})
