import { expect, test, type Request } from '@playwright/test'
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

test('the team adds, renames and removes a school', async ({ page }) => {
    const seen = await mockServices(page, {
        'POST /account/admin/schools': (req: Request) => req.postDataJSON(),
        'PUT /account/admin/schools/ENSI': (req: Request) => ({ code: 'ENSI', ...req.postDataJSON() }),
        'DELETE /account/admin/schools/ENIS': {},
    })
    await signIn(page, ADMIN)
    await page.getByRole('link', { name: 'Écoles' }).click()
    await expect(page.getByRole('heading', { name: 'Écoles', level: 1 })).toBeVisible()
    await expect(page.getByText('3 écoles')).toBeVisible()
    await expect(page.getByText('ENET’Com — École Nationale d’Électronique et des Télécommunications de Sfax')).toBeVisible()

    await page.getByRole('button', { name: 'Ajouter une école' }).click()
    await page.getByLabel('Code').fill('bad code')
    await page.getByLabel('Nom en français').fill('Nouvelle école')
    await page.getByLabel('Nom en anglais').fill('New school')
    await page.getByLabel('Nom en arabe').fill('مدرسة جديدة')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByText('Le code doit faire 2 à 20 caractères')).toBeVisible()
    expect(seen.filter((r) => r.method === 'POST')).toHaveLength(0)
    await page.getByLabel('Code').fill('nouv-1')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByText('École enregistrée')).toBeVisible()
    expect(seen.find((r) => r.method === 'POST')?.body).toEqual({ code: 'NOUV-1', name_fr: 'Nouvelle école', name_en: 'New school', name_ar: 'مدرسة جديدة' })

    await page.getByRole('button', { name: 'Modifier ENSI' }).click()
    await expect(page.getByLabel('Code')).toHaveAttribute('readonly', '')
    await page.getByLabel('Nom en anglais').fill('National School of Computer Sciences')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByText('École enregistrée')).toBeVisible()
    expect(seen.find((r) => r.method === 'PUT')?.body).toMatchObject({ name_en: 'National School of Computer Sciences' })

    await page.getByRole('button', { name: 'Retirer ENIS' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Retirer' }).click()
    await expect(page.getByText('École retirée')).toBeVisible()
    expect(seen.some((r) => r.method === 'DELETE' && r.path === '/account/admin/schools/ENIS')).toBe(true)
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
