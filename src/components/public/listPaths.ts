import type { PublicFacet } from '@/types/job'

// What a public list page shows: all offers, or those of one city or one company.
export type ListKind = { kind: 'all' } | { kind: 'city'; facet: PublicFacet } | { kind: 'company'; facet: PublicFacet }

// basePath is the address of a list page without its page number.
export function basePath(k: ListKind): string {
    return k.kind === 'all' ? '/offres' : `/offres/${k.kind === 'city' ? 'ville' : 'entreprise'}/${k.facet.slug}`
}

// pagePath is the address of page n of a list (page 1 has no number).
export const pagePath = (k: ListKind, n: number) => (n > 1 ? `${basePath(k)}?page=${n}` : basePath(k))

// pageOf reads ?page=: a whole number from 2, else page 1 (anything else is the first page, never an error).
export const pageOf = (v?: string) => (v && /^[1-9]\d{0,3}$/.test(v) ? Number(v) : 1)
