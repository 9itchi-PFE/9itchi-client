import type { BodyFont, CVStyle, Layout } from '@/types/resume'

// Typefaces offered for the whole CV; the PDF embeds the same families (Carlito and Tinos are metric twins of Calibri and Times New Roman).
export const BODY_FONTS: Record<BodyFont, { label: string; stack: string }> = {
    sourcesans: { label: 'Source Sans 3', stack: '' },
    lato: { label: 'Lato', stack: '"Lato","Noto Sans Arabic Variable",sans-serif' },
    carlito: { label: 'Calibri', stack: '"Carlito","Noto Sans Arabic Variable",sans-serif' },
    tinos: { label: 'Times New Roman', stack: '"Tinos","Times New Roman",serif' },
    amiri: { label: 'Amiri', stack: '"Amiri","Noto Sans Arabic Variable",serif' },
    ptsans: { label: 'PT Sans', stack: '"PT Sans","Noto Sans Arabic Variable",sans-serif' },
    ptserif: { label: 'PT Serif', stack: '"PT Serif","Noto Sans Arabic Variable",serif' },
    crimson: { label: 'Crimson Text', stack: '"Crimson Text","Noto Sans Arabic Variable",serif' },
}

// Mirrors resume-api core/pdf_style.go (layoutLooks + newLook): the preview and the exports resolve a style the same way.
type LayoutLook = { base: number; name: number; title: number; head: number; mx: number; my: number; upper: boolean; nameSerif: boolean; center: boolean }

export const layoutLooks: Record<Layout, LayoutLook> = {
    classic: { base: 10.5, name: 23, title: 12, head: 13, mx: 14, my: 12, upper: true, nameSerif: false, center: false },
    modern: { base: 10, name: 22, title: 10.5, head: 13, mx: 9, my: 12, upper: false, nameSerif: true, center: false },
    compact: { base: 10, name: 17, title: 10, head: 11, mx: 15, my: 12, upper: true, nameSerif: false, center: true },
    sidebar: { base: 10, name: 22, title: 11, head: 12, mx: 8, my: 12, upper: true, nameSerif: false, center: false },
    split: { base: 10, name: 22, title: 11, head: 12, mx: 12, my: 12, upper: true, nameSerif: false, center: false },
    banner: { base: 10, name: 24, title: 11, head: 12, mx: 10, my: 12, upper: true, nameSerif: false, center: false },
}

export const DEFAULT_ACCENT_TARGETS = ['title', 'headings', 'rules', 'entry_title', 'subtitle', 'links'] as const

export type Look = {
    base: number
    name: number
    title: number
    head: number
    entry: number
    lineHeight: number
    gap: number | null
    mx: number
    my: number
    nameSerif: boolean
    upper: boolean
    headBold: boolean
    dateBelow: boolean
    hyphen: boolean
    indent: boolean
    center: boolean
    sep: string
    showPhoto: boolean
    photoRight: boolean
    valign: 'top' | 'middle' | 'bottom'
    icons: boolean
    inlineTitle: boolean
    bodyFont: BodyFont
    accent?: string
    text?: string
    bg?: string
    accents: (target: string) => boolean
    sectionGap: number | null
}

const PX_PER_MM = 624 / 210
export const mmToPx = (mm: number) => mm * PX_PER_MM

export type EntrySection = 'experience' | 'education'
export type EntryArrangement = { inline: boolean; subtitleFirst: boolean }

// What each template does today for an entry: Classic stacks the title over the company; Modern puts both on one line (title first for jobs,
// school first for studies); Compact is one line with the company/school first; Sidebar, Split and Banner stack like Classic.
const ENTRY_DEFAULTS: Record<Layout, Record<EntrySection, EntryArrangement>> = {
    classic: { experience: { inline: false, subtitleFirst: false }, education: { inline: false, subtitleFirst: false } },
    modern: { experience: { inline: true, subtitleFirst: false }, education: { inline: true, subtitleFirst: true } },
    compact: { experience: { inline: true, subtitleFirst: true }, education: { inline: true, subtitleFirst: true } },
    sidebar: { experience: { inline: false, subtitleFirst: false }, education: { inline: false, subtitleFirst: false } },
    split: { experience: { inline: false, subtitleFirst: false }, education: { inline: false, subtitleFirst: false } },
    banner: { experience: { inline: false, subtitleFirst: false }, education: { inline: false, subtitleFirst: false } },
}

export const entryDefault = (layout: Layout, section: EntrySection): EntryArrangement => (ENTRY_DEFAULTS[layout] ?? ENTRY_DEFAULTS.classic)[section]

// entryArrangement mirrors resume-api's entry layout: null while the style sets neither field (the template keeps its own head),
// otherwise the chosen value with the template's default for the one left unset.
// For studies, education_order wins over entry_order.
export function entryArrangement(layout: Layout, section: EntrySection, s?: CVStyle): EntryArrangement | null {
    const order = section === 'education' ? (s?.education_order ?? s?.entry_order) : s?.entry_order
    if (!s?.entry_layout && !order) return null
    const d = entryDefault(layout, section)
    return {
        inline: s?.entry_layout ? s.entry_layout === 'inline' : d.inline,
        subtitleFirst: order ? order === 'subtitle_first' : d.subtitleFirst,
    }
}

const SKILL_SEPARATORS = { comma: ', ', bullet: '  •  ', bar: '  |  ' } as const

// skillSep is what sits between two skills: the chosen separator, else the template's own.
export const skillSep = (s: CVStyle | undefined, fallback: string): string => (s?.skills_style && Object.hasOwn(SKILL_SEPARATORS, s.skills_style) && SKILL_SEPARATORS[s.skills_style]) || fallback

// groupRoles cuts the jobs into runs held at the same company (trimmed, case-insensitive) when the style asks for it; otherwise one job per run.
export function groupRoles<E extends { company?: string }>(list: E[], on?: boolean): E[][] {
    const key = (e: E) => (e.company ?? '').trim().toLowerCase()
    const out: E[][] = []
    for (const e of list) {
        const last = out[out.length - 1]
        if (on && last && key(e) && key(last[0]) === key(e)) last.push(e)
        else out.push([e])
    }
    return out
}

const hex = (s?: string) => (s && /^#[0-9a-fA-F]{6}$/.test(s) ? s : undefined)

export function resolveLook(layout: Layout, s: CVStyle = {}): Look {
    const d = layoutLooks[layout] ?? layoutLooks.classic
    const base = s.base_size ?? d.base
    const accent = hex(s.accent)
    const targets: readonly string[] = s.accent_on ?? DEFAULT_ACCENT_TARGETS
    const multi = s.color_mode === 'multi'
    return {
        base,
        name: base + (s.name_delta ?? d.name - d.base),
        title: base + (s.title_delta ?? d.title - d.base),
        head: base + (s.heading_delta ?? d.head - d.base),
        entry: base + (s.entry_delta ?? 0),
        lineHeight: s.line_height ?? 1.38,
        gap: s.gap ?? null,
        mx: s.margin_x ?? d.mx,
        my: s.margin_y ?? d.my,
        nameSerif: s.name_font ? s.name_font === 'serif' : d.nameSerif,
        upper: s.heading_case ? s.heading_case === 'uppercase' : d.upper,
        headBold: s.heading_bold ?? layout !== 'classic',
        dateBelow: s.date_position === 'below',
        hyphen: s.list_style === 'hyphen',
        indent: s.indent_body !== false,
        center: s.align ? s.align === 'center' : d.center,
        sep: s.separator === 'bar' ? ' | ' : ' · ',
        showPhoto: s.show_photo !== false,
        photoRight: s.photo_position === 'right',
        valign: s.header_valign ?? 'middle',
        icons: s.separator ? s.separator === 'icon' : layout === 'classic' || layout === 'sidebar',
        inlineTitle: s.header_layout !== 'stacked' && !(s.align ? s.align === 'center' : d.center),
        bodyFont: s.body_font && BODY_FONTS[s.body_font] ? s.body_font : 'sourcesans',
        accent,
        text: multi ? hex(s.text) : undefined,
        bg: multi ? hex(s.background) : undefined,
        accents: (t) => !!accent && targets.includes(t),
        sectionGap: typeof s.section_gap === 'number' ? Math.min(12, Math.max(0, s.section_gap)) : null,
    }
}

// The rule under section headings; width and style only, so the template (or the accent) keeps its color.
const HEADING_RULES = {
    none: 'border-bottom-width:0;',
    thin: 'border-bottom-width:1px;border-bottom-style:solid;',
    thick: 'border-bottom-width:2px;border-bottom-style:solid;',
} as const

// lookCss turns a Look into rules scoped to .cvx; only what the user changed is colored, so untouched CVs keep their template colors.
export function lookCss(l: Look, explicit: CVStyle = {}): string {
    const r: string[] = []
    const rule = (sel: string, body: string) => body && r.push(`.cvx ${sel}{${body}}`)
    const stack = BODY_FONTS[l.bodyFont].stack
    if (stack) r.push(`.cvx,.cvx .font-cv{font-family:${stack};}`)
    rule('[data-cv=body]', `font-size:${l.base}px;line-height:${l.lineHeight};`)
    rule('[data-cv=name]', `font-size:${l.name}px;${explicit.accent ? `color:${l.accents('name') ? l.accent : 'inherit'};` : ''}`)
    rule('[data-cv=title]', `font-size:${l.title}px;${explicit.accent ? `color:${l.accents('title') ? l.accent : 'inherit'};` : ''}`)
    rule(
        '[data-cv=heading]',
        `font-size:${l.head}px;${explicit.heading_bold === undefined ? '' : `font-weight:${explicit.heading_bold ? 700 : 400};`}${explicit.heading_case ? `text-transform:${l.upper ? 'uppercase' : 'none'};` : ''}` +
            (explicit.accent ? `color:${l.accents('headings') ? l.accent : 'inherit'};border-color:${l.accents('rules') ? l.accent : 'currentColor'};` : ''),
    )
    rule('[data-cv=row]', `font-size:${l.entry}px;`)
    if (l.dateBelow) rule('[data-cv=row]', 'flex-direction:column;gap:0;')
    if (l.dateBelow) rule('[data-cv=row] > span:last-child', 'text-align:start;')
    const ts = (v?: string) =>
        v === 'bold'
            ? 'font-weight:700;font-style:normal;'
            : v === 'italic'
              ? 'font-style:italic;font-weight:400;'
              : v === 'normal'
                ? 'font-style:normal;font-weight:400;'
                : ''
    rule('[data-cv=sub]', ts(explicit.subtitle_style))
    rule('[data-cv=psub]', ts(explicit.subtitle_style))
    rule('[data-cv=row] > span:last-child', ts(explicit.date_style))
    if (explicit.accent) {
        // a spot that was not picked is neutral, even where the template paints it by itself
        const spot = (sel: string, target: string) => rule(sel, `color:${l.accents(target) ? l.accent : 'inherit'};`)
        spot('[data-cv=date]', 'dates')
        spot('[data-cv=loc]', 'location')
        spot('[data-cv=etitle]', 'entry_title')
        spot('[data-cv=sub]', 'subtitle')
    }
    if (l.accents('links')) rule('[data-cv=link]', `color:${l.accent};`)
    // a filled area (Sidebar's column, Banner's band) keeps its own colors: the accent would vanish into the fill
    if (explicit.accent)
        rule(
            '[data-fill] :is([data-cv=name],[data-cv=title],[data-cv=heading],[data-cv=link],[data-cv=date],[data-cv=loc],[data-cv=etitle],[data-cv=sub])',
            'color:inherit;border-color:currentColor;',
        )
    if (explicit.align) {
        rule('[data-cv=head]', `text-align:${l.center ? 'center' : 'start'};align-items:${l.center ? 'center' : 'flex-start'};`)
        rule('[data-cv=head] span', `text-align:${l.center ? 'center' : 'start'};`)
    }
    if (l.gap !== null) rule('[data-sec] > div + div', `margin-top:${mmToPx(l.gap)}px;`)
    if (explicit.heading_rule && Object.hasOwn(HEADING_RULES, explicit.heading_rule)) rule('[data-cv=heading]', HEADING_RULES[explicit.heading_rule])
    if (l.sectionGap !== null) {
        // the chosen space replaces the template's: no flex gap between sections, only the margin above each heading
        rule('[data-cv=body]:has(> [data-sec] > [data-cv=heading])', 'row-gap:0;')
        rule('[data-cv=heading]', `margin-top:${mmToPx(l.sectionGap)}px;`)
    }
    return r.join('')
}
