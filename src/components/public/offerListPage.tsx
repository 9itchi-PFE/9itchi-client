import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { getPublicOffers, ldJson } from '@/lib/publicJob'
import { siteUrl } from '@/lib/site'
import type { PublicOffers } from '@/types/job'
import { basePath, type ListKind, pageOf, pagePath } from './listPaths'
import OfferList from './OfferList'

// What the three public list routes share: the address params read, job-api asked, the metadata and the
// structured data (an ItemList of the offers, a BreadcrumbList), the page drawn by OfferList.

type Filter = { city?: string; company?: string }
export type ListProps = { params?: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

async function load(filter: (slug: string) => Filter, props: ListProps) {
    const slug = props.params ? (await props.params).slug : ''
    const page = pageOf((await props.searchParams).page)
    const data = await getPublicOffers({ ...(slug ? filter(slug) : {}), page })
    if (data === 'missing') notFound()
    return { slug, page, data }
}

function kindOf(slug: string, f: Filter, data: PublicOffers | null): ListKind | null {
    if (!slug) return { kind: 'all' }
    const facet = f.city ? data?.city : data?.company
    if (!facet) return null
    return f.city ? { kind: 'city', facet } : { kind: 'company', facet }
}

// listPage builds the metadata and the page of one public list route (all offers when filter is null).
export function listPage(filter: ((slug: string) => Filter) | null) {
    const pick = filter ?? (() => ({}))

    async function generateMetadata(props: ListProps): Promise<Metadata> {
        const t = await getTranslations('public.list')
        const { slug, page, data } = await load(pick, props)
        const list = kindOf(slug, pick(slug), data)
        if (!data || !list) return { title: t('allTitle'), robots: { index: false } }
        const count = data.total
        let title = t('allTitle')
        let description = t('allDescription', { count })
        if (list.kind === 'city') {
            title = t('cityTitle', { city: list.facet.name })
            description = t('cityDescription', { count, city: list.facet.name })
        } else if (list.kind === 'company') {
            title = t('companyTitle', { company: list.facet.name })
            description = t('companyDescription', { count, company: list.facet.name })
        }
        if (page > 1) title = `${title} · ${t('pageSuffix', { page })}`
        const url = pagePath(list, page)
        return {
            title,
            description,
            alternates: { canonical: url },
            // A list with nothing open is not worth a search result; its links are still followed.
            robots: count === 0 ? { index: false, follow: true } : undefined,
            openGraph: { type: 'website', title, description, url },
            twitter: { card: 'summary', title, description },
        }
    }

    async function Page(props: ListProps) {
        const session = await auth()
        if (session && !session.error && session.user?.role !== 'admin') redirect('/jobs')
        const { slug, data } = await load(pick, props)
        const list = kindOf(slug, pick(slug), data) ?? { kind: 'all' as const }
        const t = await getTranslations('public.list')
        const base = siteUrl()
        const crumbs = [
            { name: t('home'), url: `${base}/` },
            { name: t('offers'), url: `${base}/offres` },
            ...(list.kind === 'all' ? [] : [{ name: list.facet.name, url: `${base}${basePath(list)}` }]),
        ]
        const structured = [
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
            },
            ...(data && data.items.length
                ? [
                      {
                          '@context': 'https://schema.org',
                          '@type': 'ItemList',
                          numberOfItems: data.total,
                          itemListElement: data.items.map((o, i) => ({
                              '@type': 'ListItem',
                              position: (data.page - 1) * data.page_size + i + 1,
                              url: `${base}/offres/${o.id}`,
                              name: o.title,
                          })),
                      },
                  ]
                : []),
        ]
        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(structured) }} />
                <OfferList list={list} data={data} />
            </>
        )
    }

    return { generateMetadata, Page }
}
