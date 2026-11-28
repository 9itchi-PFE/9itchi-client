import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { AutoPublishProgress } from '@/components/admin/BooksScreen'
import { autoPublishPoll, runFinished } from '@/components/admin/books'
import type { AutoPublishRun } from '@/types/job'
import fr from '../../messages/fr.json'

const run = (p: Partial<AutoPublishRun> = {}): AutoPublishRun => ({
    running: false,
    started_at: '2026-11-28T09:00:00Z',
    finished_at: null,
    books_published: 3,
    topics_published: 41,
    topics_left: 7,
    offers_published: 12,
    retried: 2,
    errors: 1,
    ...p,
})

const render = (r: AutoPublishRun) =>
    renderToStaticMarkup(
        <NextIntlClientProvider locale="fr" messages={fr} timeZone="Africa/Tunis">
            <AutoPublishProgress run={r} />
        </NextIntlClientProvider>,
    )

describe('the automatic publication of the books', () => {
    it('is asked again every 3 seconds only while it runs', () => {
        expect(autoPublishPoll(run({ running: true }))).toBe(3000)
        expect(autoPublishPoll(run())).toBe(false)
        expect(autoPublishPoll(undefined)).toBe(false)
    })
    it('ends when a run seen running stops', () => {
        expect(runFinished(true, false)).toBe(true)
        expect(runFinished(undefined, false)).toBe(false)
        expect(runFinished(false, false)).toBe(false)
        expect(runFinished(true, true)).toBe(false)
    })
    it('shows its counts while it runs', () => {
        const html = render(run({ running: true }))
        for (const s of ['Books publiés', 'Sujets publiés', 'Sujets restants', 'Offres publiées', 'Relancés', 'Erreurs', '41', '12']) expect(html).toContain(s)
        expect(html).toContain('Publication en cours')
    })
    it('says when it finished', () => {
        const html = render(run({ finished_at: new Date().toISOString() }))
        expect(html).toContain('Terminée')
        expect(html).not.toContain('Publication en cours')
    })
})
