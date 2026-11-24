import type { BodyFont, CVStyle, Layout } from '@/types/resume'

// Typefaces offered for the whole CV; the PDF embeds the same families (Carlito and Tinos are metric twins of Calibri and Times New Roman).
export const BODY_FONTS: Record<BodyFont, { label: string; stack: string }> = {
    sourcesans: { label: 'Source Sans 3', stack: '' },
    lato: { label: 'Lato', stack: '"Lato","Noto Sans Arabic Variable",sans-serif' },
    carlito: { label: 'Calibri', stack: '"Carlito","Noto Sans Arabic Variable",sans-serif' },
    tinos: { label: 'Times New Roman', stack: '"Tinos","Times New Roman",serif' },
}

// Mirrors resume-api core/pdf_style.go (layoutLooks + newLook): the preview and the exports resolve a style the same way.
type LayoutLook = { base: number; name: number; title: number; head: number; mx: number; my: number; upper: boolean; nameSerif: boolean; center: boolean }

export const layoutLooks: Record<Layout, LayoutLook> = {
    classic: { base: 10.5, name: 23, title: 12, head: 13, mx: 14, my: 12, upper: true, nameSerif: false, center: false },
    modern: { base: 10, name: 22, title: 10.5, head: 13, mx: 9, my: 12, upper: false, nameSerif: true, center: false },
    compact: { base: 10, name: 17, title: 10, head: 11, mx: 15, my: 12, upper: true, nameSerif: false, center: true },
}

export const DEFAULT_ACCENT_TARGETS = ['title', 'headings', 'rules', 'entry_title', 'links'] as const

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
    dateBelow: boolean
    hyphen: boolean
    indent: boolean
    center: boolean
    sep: string
    showPhoto: boolean
    photoRight: boolean
    icons: boolean
    inlineTitle: boolean
    bodyFont: BodyFont
    accent?: string
    text?: string
    bg?: string
    accents: (target: string) => boolean
}

const PX_PER_MM = 624 / 210
export const mmToPx = (mm: number) => mm * PX_PER_MM

const hex = (s?: string) => (s && /^#[0-9a-fA-F]{6}$/.test(s) ? s : undefined)

export function resolveLook(layout: Layout, s: CVStyle = {}): Look {
    const d = layoutLooks[layout] ?? layoutLooks.classic
    const base = s.base_size ?? d.base
    const accent = hex(s.accent)
    const targets: readonly string[] = s.accent_on?.length ? s.accent_on : DEFAULT_ACCENT_TARGETS
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
        dateBelow: s.date_position === 'below',
        hyphen: s.list_style === 'hyphen',
        indent: s.indent_body !== false,
        center: s.align ? s.align === 'center' : d.center,
        sep: s.separator === 'bar' ? ' | ' : ' · ',
        showPhoto: s.show_photo !== false,
        photoRight: s.photo_position === 'right',
        icons: s.separator ? s.separator === 'icon' : layout === 'classic',
        inlineTitle: s.header_layout !== 'stacked' && !(s.align ? s.align === 'center' : d.center),
        bodyFont: s.body_font && BODY_FONTS[s.body_font] ? s.body_font : 'sourcesans',
        accent,
        text: multi ? hex(s.text) : undefined,
        bg: multi ? hex(s.background) : undefined,
        accents: (t) => !!accent && targets.includes(t),
    }
}

// lookCss turns a Look into rules scoped to .cvx; only what the user changed is colored, so untouched CVs keep their template colors.
export function lookCss(l: Look, explicit: CVStyle = {}): string {
    const r: string[] = []
    const rule = (sel: string, body: string) => body && r.push(`.cvx ${sel}{${body}}`)
    const stack = BODY_FONTS[l.bodyFont].stack
    if (stack) r.push(`.cvx,.cvx .font-cv{font-family:${stack};}`)
    rule('[data-cv=body]', `font-size:${l.base}px;line-height:${l.lineHeight};`)
    rule('[data-cv=name]', `font-size:${l.name}px;${l.accents('name') ? `color:${l.accent};` : ''}`)
    rule('[data-cv=title]', `font-size:${l.title}px;${explicit.accent ? `color:${l.accents('title') ? l.accent : 'inherit'};` : ''}`)
    rule(
        '[data-cv=heading]',
        `font-size:${l.head}px;${explicit.heading_case ? `text-transform:${l.upper ? 'uppercase' : 'none'};` : ''}` +
            (explicit.accent ? `color:${l.accents('headings') ? l.accent : 'inherit'};border-color:${l.accents('rules') ? l.accent : 'currentColor'};` : '')
    )
    rule('[data-cv=row]', `font-size:${l.entry}px;`)
    if (l.dateBelow) rule('[data-cv=row]', 'flex-direction:column;gap:0;')
    if (l.dateBelow) rule('[data-cv=row] > span:last-child', 'text-align:start;')
    const ts = (v?: string) => (v === 'bold' ? 'font-weight:700;font-style:normal;' : v === 'italic' ? 'font-style:italic;font-weight:400;' : v === 'normal' ? 'font-style:normal;font-weight:400;' : '')
    rule('[data-cv=sub]', ts(explicit.subtitle_style))
    rule('[data-cv=row] > span:last-child', ts(explicit.date_style))
    if (l.accents('dates')) rule('[data-cv=row] > span:last-child', `color:${l.accent};`)
    if (l.accents('entry_title')) rule('[data-sec] strong', `color:${l.accent};`)
    if (l.accents('links')) rule('[data-cv=link]', `color:${l.accent};`)
    if (explicit.align) {
        rule('[data-cv=head]', `text-align:${l.center ? 'center' : 'start'};align-items:${l.center ? 'center' : 'flex-start'};`)
        rule('[data-cv=head] span', `text-align:${l.center ? 'center' : 'start'};`)
    }
    if (l.gap !== null) rule('[data-sec] > div + div', `margin-top:${mmToPx(l.gap)}px;`)
    return r.join('')
}
