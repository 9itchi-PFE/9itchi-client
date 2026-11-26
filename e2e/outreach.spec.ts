import { expect, test } from '@playwright/test'
import { JOBS, RESUME, RESUME_ID, STUDENT, job, mockServices, signIn } from './services'

const NO_EMAIL = job('0e2e0000-0000-4000-8000-0000000000a3', 'Application mobile', 'Entreprise Gamma', { easy_apply: false })

test('offers come ranked by the chosen CV, the goal goes to the AI, and the email leaves as an application', async ({ page }) => {
    const queries: string[] = []
    const seen = await mockServices(page, {
        'GET /resume/resumes': { items: [RESUME], total: 1 },
        [`GET /resume/resumes/${RESUME_ID}`]: RESUME,
        'GET /email/emails': [],
        'GET /email/gmail/status': { connected: true, email: 'prenom.nom@exemple.tn' },
        'GET /job/jobs': (_req: unknown, url: URL) => {
            queries.push(url.search)
            return { items: [...JOBS, NO_EMAIL], total: 3, page: 1, page_size: 8 }
        },
        'POST /email/emails/draft': { subject: 'Candidature PFE', body: 'Bonjour, …', limit: null, used: 0 },
        'POST /email/applications': { id: 'a1', job_id: JOBS[0].id, status: 'sent', via: 'gmail', created_at: new Date().toISOString() },
    })
    await signIn(page, STUDENT)
    await page.goto('/outreach')

    await expect(page.getByText('Classées selon les compétences de « Mon CV »')).toBeVisible()
    expect(queries.some((q) => q.includes('sort=match') && q.includes('skill=React') && q.includes('skill=TypeScript'))).toBe(true)
    await expect(page.getByText('1/2 compétences de ton CV').first()).toBeVisible()
    await expect(page.getByText('0/2 compétences de ton CV')).toHaveCount(0)

    await page.getByLabel('Objectif').fill('Obtenir un entretien')
    const alpha = page.getByRole('listitem').filter({ hasText: 'Entreprise Alpha' })
    await alpha.getByRole('button', { name: /Générer l.e-mail/ }).click()
    await expect(alpha.getByText('Le recruteur de l’offre', { exact: false })).toBeVisible()
    await expect(alpha.locator('textarea')).toHaveValue('Bonjour, …')
    const draft = seen.find((r) => r.path === '/email/emails/draft')
    expect(draft?.body).toMatchObject({ job_id: JOBS[0].id, resume_id: RESUME_ID, goal: 'Obtenir un entretien' })

    await alpha.getByRole('button', { name: 'Envoyer via Gmail' }).click()
    await expect(alpha.getByText('Envoyé')).toBeVisible()
    const sent = seen.find((r) => r.method === 'POST' && r.path === '/email/applications')
    expect(sent?.body).toMatchObject({ job_id: JOBS[0].id, resume_id: RESUME_ID, via: 'gmail', subject: 'Candidature PFE' })
    expect((sent?.body as { to?: string }).to).toBeUndefined()

    const gamma = page.getByRole('listitem').filter({ hasText: 'Entreprise Gamma' })
    await gamma.getByRole('button', { name: /Générer l.e-mail/ }).click()
    const to = gamma.getByRole('textbox', { name: /E-mail du recruteur/ })
    await expect(to).toBeVisible()
    await expect(gamma.getByRole('button', { name: 'Envoyer via Gmail' })).toBeDisabled()
    await to.fill('rh@gamma.tn')
    await expect(gamma.getByRole('button', { name: 'Envoyer via Gmail' })).toBeEnabled()
})
