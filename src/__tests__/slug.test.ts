import { describe, expect, it } from 'vitest'
import { pageOf, pagePath } from '@/components/public/listPaths'
import { cityOf, slug } from '@/lib/slug'

describe('slug, as job-api names cities and companies', () => {
    it.each([
        ['Sfax', 'sfax'],
        [' Société  Générale ', 'societe-generale'],
        ['Ben Arous / Mégrine', 'ben-arous-megrine'],
        ["L'Ariana", 'l-ariana'],
        ['صفاقس', ''],
        ['Atlas-Logiciel S.A.R.L', 'atlas-logiciel-s-a-r-l'],
    ])('%s -> %s', (name, want) => expect(slug(name)).toBe(want))

    it('takes the city from a location, never the country or remote work', () => {
        expect(cityOf('Sfax, Tunisie')).toBe('Sfax')
        expect(cityOf('  La  Marsa ')).toBe('La Marsa')
        expect(cityOf('Tunisie')).toBe('')
        expect(cityOf('Télétravail')).toBe('')
    })
})

describe('list addresses', () => {
    it('reads ?page= as a page from 1, never an error', () => {
        expect(pageOf(undefined)).toBe(1)
        expect(pageOf('3')).toBe(3)
        expect(pageOf('0')).toBe(1)
        expect(pageOf('-2')).toBe(1)
        expect(pageOf('abc')).toBe(1)
    })

    it('gives page 1 no number', () => {
        const city = { kind: 'city' as const, facet: { slug: 'sfax', name: 'Sfax', count: 3 } }
        expect(pagePath({ kind: 'all' }, 1)).toBe('/offres')
        expect(pagePath({ kind: 'all' }, 2)).toBe('/offres?page=2')
        expect(pagePath(city, 1)).toBe('/offres/ville/sfax')
        expect(pagePath({ kind: 'company', facet: { slug: 'acme', name: 'Acme', count: 1 } }, 3)).toBe('/offres/entreprise/acme?page=3')
    })
})
