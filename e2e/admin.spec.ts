import { expect, test } from '@playwright/test'
import { ADMIN, mockServices, signIn } from './services'

const templates = [
    { id: '0e2e0000-0000-4000-8000-0000000000d1', name: 'Classic', layout: 'classic', preview_url: '', active: true, resumes: 12 },
    { id: '0e2e0000-0000-4000-8000-0000000000d2', name: 'Modern', layout: 'modern', preview_url: '', active: true, resumes: 3 },
    { id: '0e2e0000-0000-4000-8000-0000000000d3', name: 'Compact', layout: 'compact', preview_url: '', active: false, resumes: 0 },
]

test('the team withdraws a template after confirming, and the last published one stays', async ({ page }) => {
    const seen = await mockServices(page, {
        'GET /resume/admin/templates': { items: templates },
        [`PUT /resume/admin/templates/${templates[0].id}`]: { ...templates[0], active: false },
    })
    await signIn(page, ADMIN)
    await expect(page).toHaveURL(/\/admin$/)
    await page.getByRole('link', { name: 'Modèles CV' }).click()
    await expect(page.getByRole('heading', { name: 'Modèles de CV' })).toBeVisible()
    await expect(page.getByText('12 CV')).toBeVisible()

    page.once('dialog', (d) => {
        expect(d.message()).toContain('Les 12 CV qui l’utilisent le gardent')
        void d.accept()
    })
    await page.getByRole('listitem').filter({ hasText: 'Classique' }).getByRole('button', { name: 'Retirer' }).click()
    await expect(page.getByText('Classique retiré des choix')).toBeVisible()
    expect(seen.find((r) => r.method === 'PUT')?.body).toEqual({ active: false })
})

test('with one template published, it cannot be withdrawn', async ({ page }) => {
    await mockServices(page, {
        'GET /resume/admin/templates': { items: [templates[0], { ...templates[1], active: false }, templates[2]] },
    })
    await signIn(page, ADMIN)
    await page.goto('/admin/templates')
    const classic = page.getByRole('listitem').filter({ hasText: 'Classique' })
    await expect(classic.getByRole('button', { name: 'Retirer' })).toBeDisabled()
    await expect(classic.getByText('Dernier modèle publié : il en faut toujours un.')).toBeVisible()
})

test('the overview and the statistics show the replies the students marked', async ({ page }) => {
    const metric = (total: number) => ({ total, series: [] })
    const dashboard = { metrics: { email_sent: metric(20), email_opened: metric(10), replies: metric(3), user_registered: metric(5) } }
    await mockServices(page, {
        'GET /statistics/admin/statistics/overview': dashboard,
    })
    await signIn(page, ADMIN)
    await expect(page.getByText('50 % ouvertes par le recruteur · 3 réponses')).toBeVisible()
    await page.goto('/admin/stats')
    await expect(page.getByText('Réponses reçues')).toBeVisible()
})
