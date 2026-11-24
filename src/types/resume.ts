// Mirrors resume-api's resumes.content schema and responses.

export type Contact = {
    name: string
    headline?: string
    email: string
    phone: string
    location: string
    links: string[]
}
export type Experience = { company: string; title: string; kind?: string; location?: string; start: string; end: string; description: string[] }
export type Education = { school: string; degree: string; location?: string; start: string; end: string }
export type Project = { name: string; tech: string; year: string; description: string[] }
export type SkillGroup = { label: string; items: string[] }
export type Certification = { name: string; issuer: string; year: string }
export type ExtraSection = { title: string; items: string[] }

export type CVStyle = {
    base_size?: number
    name_delta?: number
    title_delta?: number
    heading_delta?: number
    entry_delta?: number
    line_height?: number
    gap?: number
    margin_x?: number
    margin_y?: number
    name_font?: 'sans' | 'serif'
    heading_case?: 'capitalize' | 'uppercase'
    date_position?: 'right' | 'below'
    align?: 'left' | 'center'
    separator?: 'bullet' | 'bar'
    color_mode?: 'single' | 'multi'
    accent?: string
    text?: string
    background?: string
    accent_on?: AccentTarget[]
    show_photo?: boolean
    body_font?: BodyFont
}
export type BodyFont = 'sourcesans' | 'lato' | 'carlito' | 'tinos'
export type AccentTarget = 'name' | 'title' | 'headings' | 'rules' | 'dates' | 'entry_title' | 'links'

export type ResumeContent = {
    contact: Contact
    summary: string
    experience: Experience[]
    education: Education[]
    projects?: Project[]
    skills: string[]
    skill_groups?: SkillGroup[]
    languages: string[]
    certifications: Certification[]
    extra?: ExtraSection[]
    section_order?: string[]
    hidden_sections?: string[]
    style?: CVStyle
}

export const DEFAULT_ORDER = ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'languages'] as const

// sectionOrder mirrors resume-api's SectionOrder: chosen keys first (unknown/repeated dropped), the rest by default order.
export function sectionOrder(c: Pick<ResumeContent, 'extra' | 'section_order'>): string[] {
    const all: string[] = [...DEFAULT_ORDER, ...(c.extra ?? []).map((_, i) => `extra:${i}`)]
    const known = new Set(all)
    const out: string[] = []
    for (const k of c.section_order ?? []) if (known.has(k) && !out.includes(k)) out.push(k)
    for (const k of all) if (!out.includes(k)) out.push(k)
    return out
}

// visibleSections mirrors Go SectionOrder: the order without hidden sections.
export function visibleSections(c: Pick<ResumeContent, 'extra' | 'section_order' | 'hidden_sections'>): string[] {
    const hidden = new Set(c.hidden_sections ?? [])
    return sectionOrder(c).filter((k) => !hidden.has(k))
}

export type ParseStatus = 'none' | 'pending' | 'done' | 'failed'
export type RemovedDetail = 'age' | 'birth_date' | 'nationality' | 'marital_status' | 'full_address'
export type ParseReport = { pages: number; seconds: number; rewritten: number; removed: RemovedDetail[] }

export type Resume = {
    id: string
    title: string
    template_id: string | null
    version: number
    parse_status: ParseStatus
    language: 'fr' | 'en' | 'ar' | null
    parse_report: ParseReport | null
    has_photo: boolean
    content: ResumeContent
    created_at: string
    updated_at: string
}

export type ResumeListItem = Omit<Resume, 'content' | 'parse_report' | 'has_photo'>
export type ResumeList = { items: ResumeListItem[]; total: number; page: number; page_size: number }

export type Version = { id: string; version_no: number; label: string; created_at: string }
export type VersionWithContent = Version & { content: ResumeContent }

export type Layout = 'classic' | 'modern' | 'compact'
export type Template = { id: string; name: string; layout: Layout; preview_url: string; active: boolean }

export type ResumeFile = {
    id: string
    resume_id: string
    kind: 'original' | 'export' | 'photo'
    format: 'pdf' | 'docx' | 'jpeg' | 'png'
    filename: string
    content_type: string
    size_bytes: number
    created_at: string
}

export type RuleStatus = 'ok' | 'fix' | 'tip'
export type RuleGroup = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'layout' | 'file'
export type RuleResult = { id: string; group: RuleGroup; status: RuleStatus; where?: string; was?: string; now?: string }
export type ATSCheck = { passed: number; total: number; to_fix: number; rules: RuleResult[] }

export const emptyContent = (): ResumeContent => ({
    contact: { name: '', headline: '', email: '', phone: '', location: '', links: [] },
    summary: '',
    experience: [],
    education: [],
    projects: [],
    skills: [],
    skill_groups: [],
    languages: [],
    certifications: [],
    extra: [],
})

// normalize fills the optional lists so the editor never meets undefined.
export function normalize(c: Partial<ResumeContent> | undefined): ResumeContent {
    const e = emptyContent()
    return {
        ...e,
        ...c,
        contact: { ...e.contact, ...(c?.contact ?? {}), links: c?.contact?.links ?? [] },
        experience: (c?.experience ?? []).map((x) => ({ ...x, description: x.description ?? [] })),
        education: c?.education ?? [],
        projects: (c?.projects ?? []).map((x) => ({ ...x, description: x.description ?? [] })),
        skills: c?.skills ?? [],
        skill_groups: c?.skill_groups ?? [],
        languages: c?.languages ?? [],
        certifications: c?.certifications ?? [],
        extra: c?.extra ?? [],
    }
}
