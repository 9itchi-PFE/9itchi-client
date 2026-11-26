import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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
// A real PDF of three pages: the viewer draws the page asked for (3) on a canvas.
const PDF = readFileSync(join(__dirname, 'fixtures', 'book-3-pages.pdf'))
const NO_PDF = 'L’entreprise n’a pas joint de PDF à ce book.'
const PAGE_3 = 'Page 3 / 12'

test('the PDF shows the page of the topic as soon as it is drawn, after a short wait', async ({ page }) => {
    await mockServices(page, {
        [`GET /job/books/${BOOK_ID}`]: book(),
        [`GET /job/books/${BOOK_ID}/pdf`]: async () => {
            await new Promise((r) => setTimeout(r, 1500))
            return PDF
        },
    })
    await signIn(page, STUDENT)
    await page.goto(`/books/${BOOK_ID}`)
    await expect(page.getByRole('status').filter({ hasText: 'Chargement de la page' })).toBeVisible()
    await expect(page.getByText(NO_PDF)).toHaveCount(0)
    await expect(page.getByRole('img', { name: PAGE_3 })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Page suivante' }).click()
    await expect(page.getByRole('img', { name: 'Page 4 / 12' })).toBeVisible({ timeout: 20_000 })
})

test('a PDF that fails offers a retry that shows the page', async ({ page }) => {
    let calls = 0
    await mockServices(page, {
        [`GET /job/books/${BOOK_ID}`]: book(),
        [`GET /job/books/${BOOK_ID}/pdf`]: () => (++calls === 1 ? [500, { error: 'boom' }] : PDF),
    })
    await signIn(page, STUDENT)
    await page.goto(`/books/${BOOK_ID}`)
    await expect(page.getByRole('alert').filter({ hasText: 'La page du PDF n’a pas pu s’afficher.' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await expect(page.getByRole('img', { name: PAGE_3 })).toBeVisible({ timeout: 20_000 })
    expect(calls).toBeGreaterThanOrEqual(2)
})

test('on a phone the PDF opens in a window at the page of the topic', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockServices(page, { [`GET /job/books/${BOOK_ID}`]: book(), [`GET /job/books/${BOOK_ID}/pdf`]: PDF })
    await signIn(page, STUDENT)
    await page.goto(`/books/${BOOK_ID}`)
    await expect(page.getByRole('complementary', { name: 'PDF d’origine' })).toBeHidden()
    await page.getByRole('button', { name: 'Voir la page 3 du PDF' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('img', { name: PAGE_3 })).toBeVisible({ timeout: 20_000 })
    const box = await dialog.getByRole('img', { name: PAGE_3 }).boundingBox()
    expect(box!.width).toBeLessThanOrEqual(390)
})

test('a book with no PDF says so', async ({ page }) => {
    await mockServices(page, { [`GET /job/books/${BOOK_ID}`]: book({ has_pdf: false }) })
    await signIn(page, STUDENT)
    await page.goto(`/books/${BOOK_ID}`)
    await expect(page.getByText(NO_PDF)).toBeVisible()
})
