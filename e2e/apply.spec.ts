import { expect, test, type Page, type Request } from '@playwright/test'
import { JOBS, RESUME_ID, STUDENT, mockServices, signIn, type Answers } from './services'

const offer = JOBS[0]
const letter = {
    subject: 'Candidature au stage PFE',
    body: 'Bonjour,\n\nJe vous écris pour le sujet proposé.\n\nCordialement,\nPrénom Nom',
    limit: null,
    used: 0,
}

const sent = (req: Request) => {
    const b = req.postDataJSON() as { scheduled_at?: string }
    return {
        id: '0e2e0000-0000-4000-8000-0000000000e1',
        job_id: offer.id,
        email_id: '0e2e0000-0000-4000-8000-0000000000e2',
        status: b.scheduled_at ? 'scheduled' : 'sent',
        job_title: offer.title,
        company: offer.company,
        via: 'gmail',
        email: {
            id: '0e2e0000-0000-4000-8000-0000000000e2',
            status: b.scheduled_at ? 'scheduled' : 'sent',
            scheduled_at: b.scheduled_at ?? null,
            sent_at: b.scheduled_at ? null : new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
}

const base = (more: Answers = {}): Answers => ({
    [`GET /job/jobs/${offer.id}`]: { ...offer, description: 'Un portail pour les marchands.', book: null, created_at: '', updated_at: '' },
    'POST /email/emails/draft': letter,
    'GET /email/gmail/status': { connected: true, email: 'prenom.nom@exemple.tn' },
    'POST /email/applications': sent,
    ...more,
})

async function openLetter(page: Page) {
    await signIn(page, STUDENT)
    await page.goto(`/jobs/${offer.id}/apply`)
    await expect(page.getByRole('heading', { name: 'Ta lettre est prête. Rends-la à toi.' })).toBeVisible()
}

test('the letter is sent from Gmail once the student says they read it', async ({ page }) => {
    const seen = await mockServices(page, base())
    await openLetter(page)
    const send = page.getByRole('button', { name: `Envoyer à ${offer.company}` })
    await expect(send).toBeDisabled()
    await expect(page.getByLabel('Nom de la lettre de motivation')).toHaveValue('Lettre_de_motivation_Prénom_Nom')

    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await send.click()
    await expect(page.getByRole('heading', { name: `Envoyée à ${offer.company}` })).toBeVisible()
    const body = seen.find((r) => r.method === 'POST' && r.path === '/email/applications')?.body as Record<string, string>
    expect(body).toMatchObject({ job_id: offer.id, resume_id: RESUME_ID, subject: letter.subject })
    expect(body.body).toContain('Je vous écris pour le sujet proposé.')
    expect(body.scheduled_at).toBeUndefined()
    expect(body).toMatchObject({ letter_filename: 'Lettre_de_motivation_Prénom_Nom', attach_letter: true, language: 'fr' })
})

test('the CV goes under its name and the cover letter under the name the student types', async ({ page }) => {
    const seen = await mockServices(page, base())
    await openLetter(page)
    await expect(page.getByText('CV Prénom Nom.pdf')).toBeVisible()
    const name = page.getByLabel('Nom de la lettre de motivation')
    await expect(name).toHaveValue('Lettre_de_motivation_Prénom_Nom')
    await name.fill('cv prénom nom')
    await expect(page.getByText('Choisis un nom différent de celui du CV.')).toBeVisible()
    await name.fill('Lettre PFE Alpha')

    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await page.getByRole('button', { name: `Envoyer à ${offer.company}` }).click()
    await expect(page.getByRole('heading', { name: `Envoyée à ${offer.company}` })).toBeVisible()
    const body = seen.find((r) => r.method === 'POST' && r.path === '/email/applications')?.body as Record<string, unknown>
    expect(body).toMatchObject({ letter_filename: 'Lettre PFE Alpha', attach_letter: true })
    expect(body).not.toHaveProperty('cv_filename')
})

test('a scheduled application carries its time', async ({ page }) => {
    const seen = await mockServices(page, base())
    await openLetter(page)
    await page.getByRole('radio', { name: 'Programmer' }).click()
    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await page.getByRole('button', { name: 'Programmer l’envoi' }).click()
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Ta lettre est prête. Rends-la à toi.')
    const body = seen.find((r) => r.method === 'POST' && r.path === '/email/applications')?.body as Record<string, string>
    expect(new Date(body.scheduled_at).getTime()).toBeGreaterThan(Date.now())
})

test('without Gmail, sending asks to connect it and goes to Google', async ({ page }) => {
    await mockServices(
        page,
        base({ 'GET /email/gmail/status': { connected: false }, 'GET /email/gmail/connect': { url: 'https://accounts.google.test/consent' } }),
    )
    await page.route('https://accounts.google.test/**', (r) => r.fulfill({ contentType: 'text/html', body: '<h1>Google (simulé)</h1>' }))
    await openLetter(page)
    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await page.getByRole('button', { name: `Envoyer à ${offer.company}` }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Ta candidature part de ton Gmail')).toBeVisible()
    await dialog.getByRole('button', { name: 'Connecter Gmail' }).click()
    await expect(page).toHaveURL('https://accounts.google.test/consent')
})

test('without a subscription, the screen says how many applications are left', async ({ page }) => {
    await mockServices(page, base({ 'GET /email/applications/allowance': { mode: 'original', limit: 5, used: 3 } }))
    await openLetter(page)
    await expect(page.getByText('Il te reste 2 candidatures sur 5 sans abonnement')).toBeVisible()
})

test('when the plan sends nothing, sending opens the plans instead', async ({ page }) => {
    const seen = await mockServices(page, base({ 'GET /email/applications/allowance': { mode: 'none', limit: null, used: 0 } }))
    await openLetter(page)
    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await page.getByRole('button', { name: `Envoyer à ${offer.company}` }).click()
    await expect(page.getByRole('dialog').getByText('L’envoi depuis ton Gmail fait partie de l’abonnement')).toBeVisible()
    expect(seen.filter((r) => r.method === 'POST' && r.path === '/email/applications')).toHaveLength(0)
})

test('the details of « Mon profil » go under the letter that is sent', async ({ page }) => {
    const seen = await mockServices(
        page,
        base({
            'GET /account/users/me': {
                id: '0e2e0000-0000-4000-8000-000000000001',
                name: 'Prénom Nom',
                email: 'etudiant@exemple.tn',
                role: 'candidate',
                status: 'active',
                language: 'fr',
                school: 'ENIS',
                speciality: 'Génie logiciel',
                year: 'ing3',
                linkedin: 'https://www.linkedin.com/in/prenom-nom',
            },
        }),
    )
    await openLetter(page)
    await expect(page.getByText('linkedin.com/in/prenom-nom')).toBeVisible()
    await expect(page.getByText('Génie logiciel, 3e année, cycle ingénieur')).toBeVisible()
    await page.getByText('J’ai relu ma lettre et elle dit ce que je veux.').click()
    await page.getByRole('button', { name: `Envoyer à ${offer.company}` }).click()
    await expect(page.getByRole('heading', { name: `Envoyée à ${offer.company}` })).toBeVisible()
    const body = (seen.find((r) => r.method === 'POST' && r.path === '/email/applications')?.body as Record<string, string>).body
    expect(body.endsWith('Prénom Nom\nGénie logiciel, 3e année, cycle ingénieur\nENIS\nlinkedin.com/in/prenom-nom')).toBe(true)
})
