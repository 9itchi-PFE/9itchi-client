import { expect, test } from '@playwright/test'
import type { Plan } from '@/types/plan'
import { ADMIN, mockServices, signIn } from './services'

const FREE: Plan = { id: 'p-free', name: 'Free', price: 0, duration_days: 36500, active: true, quotas: { free_applications: 3, cv_edit: 0 } }
const MONTH: Plan = { id: 'p-month', name: 'Mensuel', price: 35, regular_price: 50, duration_days: 30, active: true, quotas: { resumes: 10 } }

test('the team creates a plan, which takes the limits of the monthly one and joins the table', async ({ page }) => {
    let plans: Plan[] = [FREE, MONTH]
    const seen = await mockServices(page, {
        'GET /payments/admin/plans': () => ({ items: plans }),
        'POST /payments/admin/plans': (req: { postDataJSON: () => Omit<Plan, 'id'> }) => {
            const created = { ...req.postDataJSON(), id: 'p-quarter' }
            plans = [...plans, created]
            return created
        },
    })
    await signIn(page, ADMIN)
    await page.goto('/admin/plans')
    await page.getByRole('button', { name: 'Nouveau plan' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nouveau plan' })

    // A name already used is caught before anything is sent.
    await dialog.getByLabel('Nom').fill('mensuel')
    await dialog.getByLabel('Prix payé, en DT').fill('90')
    await dialog.getByRole('button', { name: 'Créer le plan' }).click()
    await expect(dialog.getByText('Un plan porte déjà ce nom.')).toBeVisible()

    await dialog.getByLabel('Nom').fill('Abonnement 3 mois')
    await dialog.getByLabel('Durée').selectOption({ label: '3 mois' })
    await dialog.getByLabel('Prix normal, en DT').fill('120')
    await expect(dialog.getByText('Il reprend les limites de « Mensuel »')).toBeVisible()
    await dialog.getByRole('button', { name: 'Créer le plan' }).click()

    await expect(page.getByText('Plan « Abonnement 3 mois » créé')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Abonnement 3 mois' })).toBeVisible()
    await expect(page.getByText('Vendu pour 3 mois')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Abonnement 3 mois' })).toBeVisible()
    await expect(page.getByRole('rowheader', { name: 'Corriger son CV dans 9itchi' })).toBeVisible()
    const sent = seen.find((r) => r.method === 'POST' && r.path === '/payments/admin/plans')
    expect(sent?.body).toEqual({ name: 'Abonnement 3 mois', price: 90, regular_price: 120, duration_days: 90, quotas: { resumes: 10 }, active: true })
})

test('the team switches a plan off after confirming, then on again', async ({ page }) => {
    let plans: Plan[] = [FREE, MONTH]
    const seen = await mockServices(page, {
        'GET /payments/admin/plans': () => ({ items: plans }),
        'DELETE /payments/admin/plans/p-month': () => {
            plans = [FREE, { ...MONTH, active: false }]
            return plans[1]
        },
        'PUT /payments/admin/plans/p-month': () => {
            plans = [FREE, MONTH]
            return MONTH
        },
    })
    await signIn(page, ADMIN)
    await page.goto('/admin/plans')
    // The app's own dialog asks first; cancelling sends nothing.
    await page.getByRole('button', { name: 'Désactiver' }).click()
    const ask = page.getByRole('dialog', { name: 'Désactiver « Mensuel » ?' })
    await expect(ask.getByText('Ses abonnés gardent leur accès jusqu’à la fin de la période payée')).toBeVisible()
    await ask.getByRole('button', { name: 'Annuler' }).click()
    await expect(ask).toBeHidden()
    expect(seen.some((r) => r.method === 'DELETE')).toBe(false)

    await page.getByRole('button', { name: 'Désactiver' }).click()
    await ask.getByRole('button', { name: 'Désactiver' }).click()
    await expect(ask).toBeHidden()
    await expect(page.getByText('« Mensuel » n’est plus proposé')).toBeVisible()
    await expect(page.getByText('Plus proposé aux étudiants.')).toBeVisible()

    await page.getByRole('button', { name: 'Réactiver' }).click()
    await expect(page.getByText('« Mensuel » est de nouveau proposé')).toBeVisible()
    const put = seen.find((r) => r.method === 'PUT' && r.path === '/payments/admin/plans/p-month')
    expect(put?.body).toMatchObject({ name: 'Mensuel', active: true, price: 35, regular_price: 50 })
})

test('the length of a plan students hold cannot change, and the team is told what to do', async ({ page }) => {
    await mockServices(page, {
        'GET /payments/admin/plans': () => ({ items: [FREE, MONTH] }),
        'PUT /payments/admin/plans/p-month': () => [409, { error: 'the length of a plan with active subscribers cannot change' }],
    })
    await signIn(page, ADMIN)
    await page.goto('/admin/plans')
    await page.getByRole('region', { name: 'Mensuel' }).getByRole('button', { name: 'Modifier' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('La durée ne change que si personne n’a ce plan')).toBeVisible()
    await dialog.getByLabel('Durée').selectOption({ label: '1 an' })
    await dialog.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(dialog.getByText('Des étudiants ont ce plan : sa durée ne peut plus changer.')).toBeVisible()
})

test('the team writes what students read in French and English, and the request carries both', async ({ page }) => {
    let plans: Plan[] = [FREE, MONTH]
    const seen = await mockServices(page, {
        'GET /payments/admin/plans': () => ({ items: plans }),
        'POST /payments/admin/plans': (req: { postDataJSON: () => Omit<Plan, 'id'> }) => {
            const created = { ...req.postDataJSON(), id: 'p-quarter' }
            plans = [...plans, created]
            return created
        },
    })
    await signIn(page, ADMIN)
    await page.goto('/admin/plans')
    await page.getByRole('button', { name: 'Nouveau plan' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nouveau plan' })
    await dialog.getByLabel('Nom').fill('Trimestre')
    await dialog.getByLabel('Durée').selectOption({ label: '3 mois' })
    await dialog.getByLabel('Prix payé, en DT').fill('90')

    await dialog.getByLabel('Label').fill('Trimestriel')
    await dialog.getByLabel('Fonctionnalités').fill('CV illimités\n\n  Candidatures  ')
    // The values of a language stay while the team writes the next one.
    await dialog.getByRole('tab', { name: 'English' }).click()
    await dialog.getByLabel('Label').fill('Quarterly')
    await dialog.getByLabel('Fonctionnalités').fill('Unlimited CVs')
    await dialog.getByRole('tab', { name: 'Français' }).click()
    await expect(dialog.getByLabel('Label')).toHaveValue('Trimestriel')
    await dialog.getByRole('button', { name: 'Créer le plan' }).click()

    await expect(page.getByText('Plan « Trimestre » créé')).toBeVisible()
    const sent = seen.find((r) => r.method === 'POST' && r.path === '/payments/admin/plans')
    expect((sent?.body as { details: unknown }).details).toEqual({
        fr: { label: 'Trimestriel', features: ['CV illimités', 'Candidatures'] },
        en: { label: 'Quarterly', features: ['Unlimited CVs'] },
    })
})
