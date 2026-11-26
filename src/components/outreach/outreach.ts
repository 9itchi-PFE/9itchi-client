import type { JobQuery } from '@/types/job'

// outreachQuery ranks the offers by the chosen CV's skills (sort=match, as on the offers screen); the search box only narrows them.
export function outreachQuery(q: string, skills: string[]): JobQuery {
    const text = q.trim() || undefined
    if (skills.length) return { q: text, skill: skills.slice(0, 50), sort: 'match', page_size: 8 }
    return { q: text, sort: text ? 'relevance' : 'date', page_size: 8 }
}
