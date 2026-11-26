import { expect, test } from '@playwright/test'
import { JOBS, STUDENT, mockServices, signIn } from './services'

const BOOK_ID = '0e2e0000-0000-4000-8000-0000000000b1'
const book = (extra: Record<string, unknown> = {}) => ({
    id: BOOK_ID,
    company: 'Entreprise Alpha',
    sector: 'Informatique',
    city: 'Sfax',
    title: 'Book PFE 2027',
    summary: '',
    year: 2027,
    published_on: '2026-10-01',
    pdf_url: null,
    pages: 12,
    open_jobs: 2,
    for_you: 0,
    created_at: '2026-10-01T09:00:00Z',
    has_pdf: true,
    jobs: JOBS.map((j) => ({ ...j, book_id: BOOK_ID, pdf_page: 3 })),
    ...extra,
})
const PDF = Buffer.from('%PDF-1.4')
const NO_PDF = 'L’entreprise n’a pas joint de PDF à ce book.'

test('a slow PDF shows that it is loading, never « no PDF », then the PDF', async ({ page }) => {
    await mockServices(page, {
        [`GET /job/books/${BOOK_ID}`]: book(),
        [`GET /job/books/${BOOK_ID}/pdf`]: async () => {
            await new Promise((r) => setTimeout(r, 2500))
            return PDF
        },
    })
    await signIn(page, STUDENT)
    await page.goto(`/books/${BOOK_ID}`)
    await expect(page.getByRole('status').filter({ hasText: 'Chargement du PDF' })).toBeVisible()
    await expect(page.getByText(NO_PDF)).toHaveCount(0)
    await expect(page.getByTitle('PDF d’origine')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('status').filter({ hasText: 'Chargement du PDF' })).toHaveCount(0)
})

test('a PDF that fails offers a retry that loads it', async ({ page }) => {
    let calls = 0
    await mockServices(page, {
        [`GET /job/books/${BOOK_ID}`]: book(),
        [`GET /job/books/${BOOK_ID}/pdf`]: () => (++calls === 1 ? [500, { error: 'boom' }] : PDF),
    })
    await signIn(page, STUDENT)
    await page.goto(`/books/${BOOK_ID}`)
    await expect(page.getByRole('alert').filter({ hasText: 'Le PDF n’a pas pu être chargé.' })).toBeVisible()
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(page.getByTitle('PDF d’origine')).toBeVisible()
    expect(calls).toBe(2)
})

test('a book with no PDF says so', async ({ page }) => {
    await mockServices(page, { [`GET /job/books/${BOOK_ID}`]: book({ has_pdf: false }) })
    await signIn(page, STUDENT)
    await page.goto(`/books/${BOOK_ID}`)
    await expect(page.getByText(NO_PDF)).toBeVisible()
})
