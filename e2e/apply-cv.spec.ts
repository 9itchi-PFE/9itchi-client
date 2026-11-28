import { expect, test, type Page } from '@playwright/test'
import { JOBS, RECRUITERS, RESUME, RESUME_ID, STUDENT, mockServices, signIn, type Answers } from './services'

const OTHER_ID = '0e2e0000-0000-4000-8000-0000000000c2'
const OTHER = { ...RESUME, id: OTHER_ID, title: 'CV data', updated_at: '2026-11-02T09:00:00Z' }
const letter = (title: string) => ({
    subject: `Candidature (${title})`,
    body: `Bonjour,\n\nÉcrite avec ${title}.\n\nCordialement,\nPrénom Nom`,
    limit: null,
    used: 0,
})

const application = { id: 'a1', job_id: '', status: 'sent', via: 'gmail', email: null, created_at: '', updated_at: '' }

const answers = (offer: (typeof JOBS)[number], more: Answers = {}): Answers => ({
    [`GET /job/jobs/${offer.id}`]: { ...offer, description: 'Un sujet.', book: null, created_at: '', updated_at: '' },
    'GET /resume/resumes': { items: [RESUME, OTHER], total: 2, page: 1, page_size: 100 },
    [`GET /resume/resumes/${OTHER_ID}`]: OTHER,
    'POST /email/emails/draft': (req: { postDataJSON: () => { resume_id: string } }) =>
        letter(req.postDataJSON().resume_id === OTHER_ID ? 'CV data' : 'Mon CV'),
    'GET /email/gmail/status': { connected: true, email: 'prenom.nom@exemple.tn' },
    'POST /email/applications': { ...application, job_id: offer.id },
    ...more,
})

async function open(page: Page, offer: (typeof JOBS)[number], heading = 'Ta lettre est prête. Rends-la à toi.') {
    await signIn(page, STUDENT)
    await page.goto(`/jobs/${offer.id}/apply`)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
}

const drafts = (seen: { path: string; body: unknown }[]) =>
    seen.filter((r) => r.path === '/email/emails/draft').map((r) => (r.body as { resume_id: string }).resume_id)

test('the student picks the CV to send: the letter is written from it and it leaves with the application', async ({ page }) => {
    const offer = JOBS[0]
    const seen = await mockServices(page, answers(offer))
    await open(page, offer)
    const pick = page.getByLabel('CV envoyé')
    await expect(pick).toContainText('Mon CV')
    await expect(page.getByLabel('Paragraphe 2')).toHaveValue('Écrite avec Mon CV.')

    await pick.click()
    await page.getByRole('option', { name: 'CV data' }).click()
    await expect(page.getByLabel('Paragraphe 2')).toHaveValue('Écrite avec CV data.')
    expect(drafts(seen)).toEqual([RESUME_ID, OTHER_ID])

    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await page.getByRole('button', { name: `Envoyer à ${offer.company}` }).click()
    const body = seen.find((r) => r.method === 'POST' && r.path === '/email/applications')?.body
    expect(body).toMatchObject({ job_id: offer.id, resume_id: OTHER_ID })
})

test('a letter the student changed is not replaced without asking', async ({ page }) => {
    const offer = JOBS[0]
    const seen = await mockServices(page, answers(offer))
    await open(page, offer)
    await page.getByLabel('Paragraphe 2').fill('Ma propre phrase.')
    await page.getByLabel('CV envoyé').click()
    await page.getByRole('option', { name: 'CV data' }).click()
    const dialog = page.getByRole('dialog', { name: 'Réécrire la lettre avec ce CV ?' })
    await dialog.getByRole('button', { name: 'Garder ma lettre' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByLabel('Paragraphe 2')).toHaveValue('Ma propre phrase.')
    expect(drafts(seen)).toEqual([RESUME_ID])

    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await page.getByRole('button', { name: `Envoyer à ${offer.company}` }).click()
    const body = seen.find((r) => r.method === 'POST' && r.path === '/email/applications')?.body
    expect(body).toMatchObject({ resume_id: OTHER_ID, body: expect.stringContaining('Ma propre phrase.') })
})

test('an offer without an address can still be sent from Gmail to the address the student found', async ({ page }) => {
    const offer = { ...JOBS[1], easy_apply: false, source: 'lever', source_url: 'https://jobs.lever.co/beta/1' }
    const seen = await mockServices(page, answers(offer as (typeof JOBS)[number]))
    await open(page, offer as (typeof JOBS)[number], 'Tes documents sont prêts. Termine sur Lever.')
    await page.getByRole('button', { name: 'Envoyer depuis Gmail' }).click()
    await expect(page.getByRole('heading', { name: 'Ta lettre est prête. Rends-la à toi.' })).toBeVisible()

    const send = page.getByRole('button', { name: `Envoyer à ${offer.company}` })
    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await expect(send).toHaveAttribute('aria-disabled', 'true')
    const to = page.getByLabel('E-mail du recruteur')
    await to.fill('rh@beta')
    await expect(page.getByText('Cette adresse n’est pas valide.')).toBeVisible()
    await to.fill('rh@beta.tn')
    await expect(send).toHaveAttribute('aria-disabled', 'false')
    await send.click()
    await expect(page.getByRole('heading', { name: `Envoyée à ${offer.company}` })).toBeVisible()
    const body = seen.find((r) => r.method === 'POST' && r.path === '/email/applications')?.body
    expect(body).toMatchObject({ job_id: offer.id, to: 'rh@beta.tn' })
})

test('an offer without an address can find the recruiter at its company and send to them', async ({ page }) => {
    const offer = { ...JOBS[1], easy_apply: false, source: 'lever', source_url: 'https://jobs.lever.co/beta/1' }
    const seen = await mockServices(page, answers(offer as (typeof JOBS)[number]))
    await open(page, offer as (typeof JOBS)[number], 'Tes documents sont prêts. Termine sur Lever.')
    await page.getByRole('button', { name: 'Envoyer depuis Gmail' }).click()

    await page.getByRole('radio', { name: 'Trouver un recruteur' }).click()
    expect(seen.some((r) => r.path === '/email/recruiters/company')).toBe(false)
    await page.getByRole('button', { name: 'Trouver le recruteur' }).click()
    await expect(page.getByText(RECRUITERS[0].email)).toBeVisible()
    expect(seen.find((r) => r.path === '/email/recruiters/company')?.body).toEqual({ company: offer.company, goal: offer.title })
    await page.getByRole('button', { name: 'Utiliser cette adresse' }).click()
    await expect(page.getByLabel('E-mail du recruteur')).toHaveValue(RECRUITERS[0].email)
    await expect(page.getByRole('radio', { name: 'Je tape l’e-mail' })).toHaveAttribute('aria-checked', 'true')
})
