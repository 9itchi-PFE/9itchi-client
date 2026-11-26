import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { ADMIN, mockServices, signIn } from './services'

const PDF = readFileSync('e2e/fixtures/book-3-pages.pdf')

const book = (id: string, company: string) => ({
    id,
    company,
    title: 'PFE book 2027',
    year: 2027,
    sector: null,
    city: null,
    summary: '',
    pdf_url: null,
    pages: 3,
    published_on: '2026-11-26',
    open_jobs: 0,
    status: 'importing',
    import_error: '',
    file_name: `${company}.pdf`,
    file_size: PDF.length,
    counts: { pending: 0, published: 0, hidden: 0 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
})

test('the team imports several PFE books at once; one refused file does not stop the others', async ({ page }) => {
    let n = 0
    const seen = await mockServices(page, {
        'GET /job/admin/books': { items: [] },
        'POST /job/admin/books/import': () => {
            n++
            if (n === 2) return [422, { error: 'this PDF has no text' }]
            return book(`0e2e0000-0000-4000-8000-0000000000b${n}`, `book${n}`)
        },
    })
    await signIn(page, ADMIN)
    await page.goto('/admin/books')

    await page.getByLabel('Fichiers PDF').setInputFiles([
        { name: 'alpha.pdf', mimeType: 'application/pdf', buffer: PDF },
        { name: 'beta.pdf', mimeType: 'application/pdf', buffer: PDF },
        { name: 'gamma.pdf', mimeType: 'application/pdf', buffer: PDF },
        { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
    ])
    const list = page.getByRole('list', { name: 'Fichiers PDF' })
    await expect(list.getByRole('listitem')).toHaveCount(4)
    await expect(list.getByText('Ce fichier n’est pas un PDF.')).toBeVisible()
    await page.getByLabel('Entreprise de alpha.pdf').fill('Entreprise Alpha')

    await page.getByRole('button', { name: 'Importer 3 PDF' }).click()
    await expect(list.getByText('Reçu, lecture en cours')).toHaveCount(2)
    await expect(list.getByText('Ce PDF ne contient pas de texte (pages scannées) : ses sujets ne peuvent pas être lus.')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/books$/)

    const sent = seen.filter((r) => r.method === 'POST' && r.path === '/job/admin/books/import')
    expect(sent).toHaveLength(3)
    await expect(page.getByRole('button', { name: /^Importer/ })).toBeDisabled()
})
