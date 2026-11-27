import { getServerBaseUrl } from '@/configs/services.config'
import type { PublicJob } from '@/types/job'

// Server side only: what search engines need of a shared offer (title, text, dates), fetched from job-api's public
// route and cached 5 minutes like the route itself. null when it does not exist or job-api does not answer.
export async function getPublicJob(id: string): Promise<PublicJob | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    try {
        const res = await fetch(`${getServerBaseUrl('job')}/public/jobs/${id}`, { next: { revalidate: 300 } })
        return res.ok ? ((await res.json()) as PublicJob) : null
    } catch {
        return null
    }
}

// The published offers still open, for the sitemap (empty when job-api does not answer).
export async function getPublicJobIndex(): Promise<{ id: string; updated_at: string }[]> {
    try {
        const res = await fetch(`${getServerBaseUrl('job')}/public/jobs`, { next: { revalidate: 3600 } })
        if (!res.ok) return []
        return ((await res.json()) as { items?: { id: string; updated_at: string }[] }).items ?? []
    } catch {
        return []
    }
}

// plain turns an offer's text into one line for a description: no markup, no repeated spaces, cut on a word.
export function plain(text: string, max = 155): string {
    const s = text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (s.length <= max) return s
    const cut = s.slice(0, max - 1)
    return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`
}

// jobPosting is the schema.org JobPosting of an open offer: what Google needs to show it in its job results.
export function jobPosting(job: PublicJob, url: string) {
    const data: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description || `${job.title} chez ${job.company}`,
        identifier: { '@type': 'PropertyValue', name: '9itchi PFE', value: job.id },
        datePosted: (job.posted_at ?? '').slice(0, 10) || undefined,
        employmentType: 'INTERN',
        hiringOrganization: { '@type': 'Organization', name: job.company },
        url,
        directApply: false,
    }
    if (job.closes_on) data.validThrough = `${job.closes_on}T23:59:59+01:00`
    if (job.work_mode === 'remote') {
        data.jobLocationType = 'TELECOMMUTE'
        data.applicantLocationRequirements = { '@type': 'Country', name: 'Tunisia' }
    }
    if (job.location || job.work_mode !== 'remote') {
        data.jobLocation = {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: job.location || undefined, addressCountry: 'TN' },
        }
    }
    if (job.stipend_tnd) {
        data.baseSalary = { '@type': 'MonetaryAmount', currency: 'TND', value: { '@type': 'QuantitativeValue', value: job.stipend_tnd, unitText: 'MONTH' } }
    }
    return data
}

// ldJson writes structured data for a <script type="application/ld+json">: a « < » in the text cannot close the tag.
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
