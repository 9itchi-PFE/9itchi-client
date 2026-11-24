import type { ResumeContent } from '@/types/resume'

// Section titles printed on the CV follow the CV's language (as resume-api's exporters do), not the UI's.
export const cvHeadings = {
    fr: {
        summary: 'Profil',
        experience: 'Expérience professionnelle',
        education: 'Formation',
        projects: 'Projets académiques',
        skills: 'Compétences',
        languages: 'Langues',
        certifications: 'Certifications',
        contact: 'Contact',
    },
    en: {
        summary: 'Summary',
        experience: 'Professional experience',
        education: 'Education',
        projects: 'Academic projects',
        skills: 'Skills',
        languages: 'Languages',
        certifications: 'Certifications',
        contact: 'Contact',
    },
} as const

export type CvLanguage = keyof typeof cvHeadings

// Shown in the preview where the phone number is missing, in the CV's language.
export const phonePlaceholder: Record<CvLanguage, string> = { fr: '[téléphone]', en: '[phone]' }

export const nonEmpty = (...parts: (string | undefined)[]) => parts.map((p) => (p ?? '').trim()).filter(Boolean)
export const join = (sep: string, ...parts: (string | undefined)[]) => nonEmpty(...parts).join(sep)
export const dates = (start?: string, end?: string) => join(' — ', start, end)

// splitLanguage reads "Arabe: Langue maternelle" as name and level (same rule as resume-api).
export function splitLanguage(s: string): [string, string] {
    for (const sep of [':', ' — ', ' – ', ' - ']) {
        const i = s.indexOf(sep)
        if (i > 0) return [s.slice(0, i).trim(), s.slice(i + sep.length).trim()]
    }
    return [s.trim(), '']
}

export const shortLink = (l: string) =>
    l
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')

export const allSkills = (c: ResumeContent) => {
    const out = [...c.skills]
    for (const g of c.skill_groups ?? []) for (const s of g.items) if (!out.includes(s)) out.push(s)
    return out
}
