import type { RuleResult } from '@/types/resume'

export const SECTIONS = ['contact', 'summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'languages'] as const
export type Section = (typeof SECTIONS)[number] | `extra:${number}`

// sectionOfPath maps a rule's JSON path (experience[0].description[1]) to the editor section that fixes it.
export function sectionOfPath(where?: string): Section | null {
    if (!where) return null
    const head = where.split(/[.[]/)[0]
    if (head === 'contact') return 'contact'
    if (head === 'skill_groups') return 'skills'
    if ((SECTIONS as readonly string[]).includes(head)) return head as Section
    if (head === 'extra') {
        const m = where.match(/^extra\[(\d+)\]/)
        return m ? (`extra:${m[1]}` as Section) : null
    }
    return null
}

// itemOfPath returns the item and line indexes of a path such as experience[2].description[1].
export function itemOfPath(where?: string): { item: number; line: number } {
    const m = where?.match(/^\w+\[(\d+)\](?:\.description\[(\d+)\])?/)
    return { item: m ? Number(m[1]) : 0, line: m?.[2] ? Number(m[2]) : 0 }
}

export function sectionsToFix(rules: RuleResult[] | undefined): Set<Section> {
    const out = new Set<Section>()
    for (const r of rules ?? []) {
        if (r.status !== 'fix') continue
        const s = sectionOfPath(r.where)
        if (s) out.add(s)
    }
    return out
}
