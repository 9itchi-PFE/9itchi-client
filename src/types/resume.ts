// Mirrors resume-api's resumes.content schema and responses.

export type Contact = {
    name: string
    headline?: string
    email: string
    phone: string
    location: string
    links: string[]
}
export type Entry = { url?: string; hidden?: boolean }
export type Experience = Entry & { company: string; title: string; kind?: string; location?: string; start: string; end: string; description: string[] }
export type Education = Entry & { school: string; degree: string; location?: string; start: string; end: string }
export type Project = Entry & {
    hide_tech?: boolean
    name: string
    tech: string
    year: string
    start?: string
    end?: string
    location?: string
    description: string[]
}
export type SkillGroup = { label: string; items: string[] }
export type Certification = Entry & { name: string; issuer: string; year: string }
export type ExtraSection = { title: string; items: string[] }

export type TextStyle = 'normal' | 'bold' | 'italic'
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
    heading_bold?: boolean
    heading_case?: 'capitalize' | 'uppercase'
    date_position?: 'right' | 'below'
    header_layout?: 'stacked' | 'inline'
    header_valign?: 'top' | 'middle' | 'bottom'
    photo_position?: 'left' | 'right'
    location_position?: 'line' | 'date'
    meta_order?: 'date_first' | 'location_first'
    meta_separator?: 'bullet' | 'hyphen' | 'bar'
    list_style?: 'bullet' | 'hyphen'
    indent_body?: boolean
    subtitle_style?: TextStyle
    date_style?: TextStyle
    align?: 'left' | 'center'
    separator?: 'bullet' | 'bar' | 'icon'
    color_mode?: 'single' | 'multi'
    accent?: string
    text?: string
    background?: string
    accent_on?: AccentTarget[]
    show_photo?: boolean
    body_font?: BodyFont
}
export type BodyFont = 'sourcesans' | 'lato' | 'carlito' | 'tinos' | 'amiri' | 'ptsans' | 'ptserif' | 'crimson'
export type AccentTarget = 'name' | 'title' | 'headings' | 'rules' | 'dates' | 'location' | 'entry_title' | 'subtitle' | 'links'

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

// LOC_MARK wraps a location folded into the dates, so the preview can color the two apart; it is invisible.
export const LOC_MARK = '\u2063'

const META_SEPARATORS = { bullet: ' · ', hyphen: ' - ', bar: ' | ' } as const

// metaText is the right-hand text of an entry: its dates and, when the style asks for it, the location beside them.
export function metaText(start: string | undefined, end: string | undefined, loc: string | undefined, style?: CVStyle): string {
    const dates = [start, end]
        .map((x) => (x ?? '').trim())
        .filter(Boolean)
        .join(' — ')
    const l = (loc ?? '').trim()
    if (!l || style?.location_position !== 'date') return dates
    const marked = LOC_MARK + l + LOC_MARK
    return (style?.meta_order === 'location_first' ? [marked, dates] : [dates, marked]).filter(Boolean).join(META_SEPARATORS[style?.meta_separator ?? 'bullet'])
}

// visibleEntries drops entries the user hid and folds each entry's dates and location into what is printed; mirrors Go visibleEntries.
export function visibleEntries<T extends Pick<ResumeContent, 'experience' | 'education' | 'projects' | 'certifications' | 'style'>>(c: T): T {
    const keep = <E extends Entry>(l: E[] = []) => l.filter((e) => !e.hidden)
    const withDates = <E extends { start?: string; end?: string; location?: string }>(e: E): E =>
        c.style?.location_position === 'date' && e.location?.trim() ? { ...e, start: metaText(e.start, e.end, e.location, c.style), end: '', location: '' } : e
    return {
        ...c,
        experience: keep(c.experience).map(withDates),
        education: keep(c.education).map(withDates),
        projects: keep(c.projects).map((p) => {
            const range = metaText(p.start, p.end, p.location, c.style)
            return range ? { ...p, year: range } : p
        }),
        certifications: keep(c.certifications),
    }
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
    // locked: beyond the plan's CV limit, the CV can be read and downloaded, not changed.
    locked?: boolean
    // locked_reason: "subscription" (editing the CV is part of the subscription) or "limit" (beyond the plan's CV limit).
    locked_reason?: 'subscription' | 'limit'
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
// AdminTemplate is a template as the team sees it: published or not, and how many CVs use it.
export type AdminTemplate = Template & { resumes: number }

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

// locked: the student's plan does not show the rule's group; nothing is said of how the CV does on it.
export type RuleStatus = 'ok' | 'fix' | 'tip' | 'locked'
export type RuleGroup = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'layout' | 'file'
export type RuleResult = { id: string; group: RuleGroup; status: RuleStatus; where?: string; was?: string; now?: string }
// locked_groups are the groups the plan does not show; passed, total and to_fix still count the whole CV.
export type ATSCheck = { passed: number; total: number; to_fix: number; rules: RuleResult[]; locked_groups?: RuleGroup[] }

// Downloads: how many downloads in the current period and what the plan allows (null: no limit, 0: none).
export type Downloads = { used: number; limit?: number | null }

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
