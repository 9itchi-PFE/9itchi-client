'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { lookCss, mmToPx, resolveLook, type Look } from '@/lib/cvLook'
import { LOC_MARK, visibleEntries, visibleSections, type Layout, type ResumeContent } from '@/types/resume'
import { Rich } from './RichText'
import { cvHeadings, dates, join, nonEmpty, shortLink, splitLanguage, type CvLanguage } from './cvText'

export type SectionKey = 'contact' | 'summary' | 'education' | 'experience' | 'projects' | 'skills' | 'certifications' | 'languages' | 'extra'

// The paper is drawn at the width of the canvas preview, then scaled to fit its box.
const BASE_W = 624
const BASE_H = Math.round((BASE_W * 297) / 210)

type Props = {
    content: ResumeContent
    layout: Layout
    language: CvLanguage
    photoUrl?: string | null
    highlight?: SectionKey
    phonePlaceholder?: string
    onPages?: (pages: number) => void
    className?: string
    ariaLabel?: string
}

const Ctx = createContext<{ highlight?: SectionKey; look: Look; language: CvLanguage }>({ look: resolveLook('classic'), language: 'en' })

const Lnk = ({ url, children }: { url?: string; children: ReactNode }) =>
    url && /^https?:\/\//i.test(url) ? (
        <a data-cv="link" href={url} target="_blank" rel="noopener noreferrer" className="text-inherit underline decoration-dotted">
            {children}
        </a>
    ) : (
        <>{children}</>
    )

const Tech = ({ p }: { p: { tech: string; hide_tech?: boolean } }) => {
    const { language } = useContext(Ctx)
    if (!p.tech?.trim() || p.hide_tech) return null
    return (
        <div className="italic">
            {language === 'fr' ? 'Technologies : ' : 'Technologies: '}
            {p.tech}
        </div>
    )
}

// CvPreview renders the CV as the three templates of screen 4.3 draw it, the same way the PDF export does.
export default function CvPreview({ content, layout, language, photoUrl, highlight, phonePlaceholder, onPages, className, ariaLabel }: Props) {
    const box = useRef<HTMLDivElement>(null)
    const paper = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const [height, setHeight] = useState(BASE_H)
    const look = useMemo(() => resolveLook(layout, content.style), [layout, content.style])
    const css = useMemo(() => lookCss(look, content.style), [look, content.style])
    const shown = useMemo(() => visibleEntries(content), [content])

    useLayoutEffect(() => {
        const el = box.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / BASE_W))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    useEffect(() => {
        const el = paper.current
        if (!el) return
        const ro = new ResizeObserver(() => {
            const h = Math.max(BASE_H, el.scrollHeight)
            setHeight(h)
            onPages?.(Math.max(1, Math.ceil((el.scrollHeight - 2) / BASE_H)))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [onPages])

    const Body = layout === 'modern' ? Modern : layout === 'compact' ? Compact : Classic
    return (
        <div ref={box} className={cn('relative w-full', className)} style={{ height: height * scale }}>
            <article
                ref={paper}
                lang={language}
                dir="ltr"
                aria-label={ariaLabel}
                className="cvx absolute left-0 top-0 origin-top-left overflow-hidden rounded bg-white font-cv text-[#1A1A1A] shadow-paper"
                style={{
                    width: BASE_W,
                    minHeight: BASE_H,
                    transform: `scale(${scale})`,
                    fontSize: look.base,
                    lineHeight: look.lineHeight,
                    color: look.text,
                    background: look.bg,
                }}
            >
                <style>{css}</style>
                <Ctx.Provider value={{ highlight, look, language }}>
                    <Body c={shown} h={cvHeadings[language]} photoUrl={look.showPhoto ? photoUrl : null} phonePlaceholder={phonePlaceholder} />
                </Ctx.Provider>
                {Array.from({ length: Math.floor((height - 2) / BASE_H) }, (_, i) => (
                    <div key={i} aria-hidden className="absolute inset-x-0 border-t border-dashed border-line-strong" style={{ top: (i + 1) * BASE_H }} />
                ))}
            </article>
        </div>
    )
}

type BodyProps = {
    c: ResumeContent
    h: (typeof cvHeadings)[CvLanguage]
    photoUrl?: string | null
    phonePlaceholder?: string
}

type Heading = (t: string) => ReactNode

function Mark({ k, children, className, head }: { k: string; children: ReactNode; className?: string; head?: boolean }) {
    const { highlight } = useContext(Ctx)
    const on = highlight === (k.startsWith('extra') ? 'extra' : k)
    return (
        <div
            data-sec={k}
            data-cv={head ? 'head' : undefined}
            className={cn(className, on && 'rounded-sm bg-[#FBFAFF] outline outline-[1.5px] outline-offset-4 outline-violet')}
            data-current={on || undefined}
        >
            {children}
        </div>
    )
}

// Meta prints the right-hand cell of a row: dates, with a location folded in between invisible marks kept apart so each takes its own accent.
const Meta = ({ t, k = 'date' }: { t?: string; k?: 'date' | 'loc' }) => (
    <>
        {(t ?? '').split(LOC_MARK).map((p, i) => (p ? <span key={i} data-cv={i % 2 ? 'loc' : k}>{p}</span> : null))}
    </>
)

const Row = ({ left, right, className }: { left: ReactNode; right?: ReactNode; className?: string }) => (
    <div data-cv="row" className={cn('flex justify-between gap-2.5', className)}>
        <span className="min-w-0">{left}</span>
        {right ? <span className="flex-none text-end">{right}</span> : null}
    </div>
)

const Bullets = ({ lines }: { lines: string[] }) => {
    const { look } = useContext(Ctx)
    const l = nonEmpty(...lines)
    if (!l.length) return null
    return (
        <ul className="m-0 mb-[3px] mt-px" style={{ listStyleType: look.hyphen ? '"- "' : 'disc', paddingInlineStart: look.indent ? 14 : 9 }}>
            {l.map((x, i) => (
                <li key={i}>
                    <Rich text={x} />
                </li>
            ))}
        </ul>
    )
}

const initials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')

type ContactKind = 'mail' | 'phone' | 'pin' | 'linkedin' | 'github' | 'web'

const CONTACT_ICONS: Record<ContactKind, string> = {
    mail: 'M3 5h18a1 1 0 0 1 1 1v.5l-10 6.5L2 6.5V6a1 1 0 0 1 1-1zm19 3.9V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.9l10 6.5z',
    phone: 'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.55 3.5a1 1 0 0 1-.25 1z',
    pin: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
    linkedin: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2.3 6.5V18h2.6V9.5zM7.6 6.2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 9.5V18h2.6v-4.3c0-1.2.6-1.9 1.6-1.9s1.4.7 1.4 1.9V18h2.6v-4.9c0-2.1-1.1-3.8-3.2-3.8-1.1 0-1.9.5-2.4 1.2V9.5z',
    github: 'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.3-4.600-1.100-4.600-5 0-1.100.4-2 1-2.700-.1-.3-.4-1.300.1-2.700 0 0 .8-.3 2.700 1a9.300 9.300 0 0 1 5 0c1.900-1.300 2.700-1 2.700-1 .5 1.400.2 2.400.1 2.700.6.700 1 1.600 1 2.700 0 3.900-2.400 4.700-4.600 5 .4.300.7.900.7 1.800V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z',
    web: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c.9 1.200 1.600 2.800 1.900 5h-3.800c.3-2.200 1-3.800 1.900-5zM4.300 14a8 8 0 0 1 0-4h3.800a17 17 0 0 0 0 4zm.7 2h3.300c.3 1.500.8 2.800 1.500 3.800A8 8 0 0 1 5 16zm3.300-8H5a8 8 0 0 1 4.800-3.800C9.100 5.200 8.600 6.500 8.300 8zm1.800 8h3.800c-.3 2.200-1 3.800-1.900 5-.9-1.200-1.600-2.800-1.900-5zm0-2a15 15 0 0 1 0-4h3.800a15 15 0 0 1 0 4zm4.200 5.800c.7-1 1.200-2.300 1.500-3.800H19a8 8 0 0 1-4.700 3.800zM15.900 14a17 17 0 0 0 0-4h3.800a8 8 0 0 1 0 4zM15.700 8c-.3-1.500-.8-2.800-1.500-3.800A8 8 0 0 1 19 8z',
}

function kindOfLink(l: string): ContactKind {
    const x = l.toLowerCase()
    return x.includes('linkedin.') ? 'linkedin' : x.includes('github.') ? 'github' : 'web'
}

function contactParts(c: ResumeContent, phonePlaceholder?: string) {
    const parts: { text: string; kind: 'plain' | 'link' | 'missing'; icon: ContactKind }[] = []
    if (c.contact.email) parts.push({ text: c.contact.email, kind: 'plain', icon: 'mail' })
    if (c.contact.phone) parts.push({ text: c.contact.phone, kind: 'plain', icon: 'phone' })
    else if (phonePlaceholder) parts.push({ text: phonePlaceholder, kind: 'missing', icon: 'phone' })
    if (c.contact.location) parts.push({ text: c.contact.location, kind: 'plain', icon: 'pin' })
    for (const l of nonEmpty(...c.contact.links)) parts.push({ text: shortLink(l), kind: 'link', icon: kindOfLink(l) })
    return parts
}

function ContactLine({ c, phonePlaceholder, linkClass, className }: { c: ResumeContent; phonePlaceholder?: string; linkClass?: string; className?: string }) {
    const { look } = useContext(Ctx)
    if (look.icons)
        return (
            <span className={cn('flex flex-wrap items-center gap-x-6 gap-y-1', className)}>
                {contactParts(c, phonePlaceholder).map((p, i) => (
                    <span key={i} className={cn('inline-flex items-center gap-1.5', p.kind === 'missing' && 'text-warn-fg')}>
                        <svg aria-hidden width="1.05em" height="1.05em" viewBox="0 0 24 24" fill="currentColor" className="flex-none text-[#111]">
                            <path d={CONTACT_ICONS[p.icon]} />
                        </svg>
                        <span data-cv={p.kind === 'link' ? 'link' : undefined} className={cn(p.kind === 'link' && linkClass)}>
                            {p.text}
                        </span>
                    </span>
                ))}
            </span>
        )
    return (
        <span className={className}>
            {contactParts(c, phonePlaceholder).map((p, i) => (
                <span key={i}>
                    {i > 0 ? look.sep : ''}
                    <span data-cv={p.kind === 'link' ? 'link' : undefined} className={cn(p.kind === 'link' && linkClass, p.kind === 'missing' && 'text-warn-fg')}>
                        {p.text}
                    </span>
                </span>
            ))}
        </span>
    )
}

const SkillRow = ({ label, items }: { label: string; items: string[] }) => (
    <>
        <strong>{label}</strong>
        <span>{nonEmpty(...items).join(', ')}</span>
    </>
)

// Each layout describes its sections once; they are laid out in the order the user chose.
type Sections = Record<string, ReactNode>

function extraSections(c: ResumeContent, head: Heading, into: Sections) {
    ;(c.extra ?? []).forEach((x, i) => {
        if (!nonEmpty(...x.items).length) return
        into[`extra:${i}`] = (
            <Mark key={`extra:${i}`} k={`extra:${i}`}>
                {head(x.title)}
                <Bullets lines={x.items} />
            </Mark>
        )
    })
}

const inOrder = (c: ResumeContent, s: Sections, only?: (k: string) => boolean) =>
    visibleSections(c)
        .filter((k) => (only ? only(k) : true))
        .map((k) => s[k])
        .filter(Boolean)

// ---- Classique: photo, blue small caps, blue rules (CV.dc.html preview) ----

function Classic({ c, h, photoUrl, phonePlaceholder }: BodyProps) {
    const { look } = useContext(Ctx)
    const head: Heading = (t) => (
        <h3 data-cv="heading" className="m-0 mb-[3px] border-b border-cv-blue pb-px font-cv font-normal uppercase tracking-[.01em] text-cv-blue" style={{ fontSize: look.head }}>
            {t}
        </h3>
    )
    const groups = c.skill_groups ?? []
    const s: Sections = {}
    if (c.summary.trim())
        s.summary = (
            <Mark key="summary" k="summary">
                {head(h.summary)}
                <Rich text={c.summary} />
            </Mark>
        )
    if (c.education.length)
        s.education = (
            <Mark key="education" k="education">
                {head(h.education)}
                {c.education.map((e, i) => (
                    <div key={i} className={cn(i > 0 && 'mt-[3px]')}>
                        <Row left={<Lnk url={e.url}><strong data-cv="etitle"><Rich text={e.degree} /></strong></Lnk>} right={<Meta t={dates(e.start, e.end)} />} />
                        <Row left={<span data-cv="sub"><Rich text={e.school} /></span>} right={<Meta t={e.location} k="loc" />} />
                    </div>
                ))}
            </Mark>
        )
    if (c.experience.length)
        s.experience = (
            <Mark key="experience" k="experience">
                {head(h.experience)}
                {c.experience.map((e, i) => (
                    <div key={i} className={cn(i > 0 && 'mt-[3px]')}>
                        <Row left={<strong data-cv="etitle"><Rich text={e.title} /></strong>} right={<strong><Meta t={dates(e.start, e.end)} /></strong>} />
                        <Row
                            left={
                                <>
                                    <Lnk url={e.url}><span data-cv="sub" className="text-cv-blue"><Rich text={e.company} /></span></Lnk>
                                    {e.kind ? ` (${e.kind})` : ''}
                                </>
                            }
                            right={<Meta t={e.location} k="loc" />}
                        />
                        <Bullets lines={e.description} />
                    </div>
                ))}
            </Mark>
        )
    if (c.projects?.length)
        s.projects = (
            <Mark key="projects" k="projects">
                {head(h.projects)}
                {c.projects.map((p, i) => (
                    <div key={i}>
                        <Row left={<Lnk url={p.url}><strong data-cv="etitle"><Rich text={p.name} /></strong></Lnk>} right={<Meta t={p.year} />} />
                        <Bullets lines={p.description} /><Tech p={p} />
                    </div>
                ))}
            </Mark>
        )
    if (groups.length || c.skills.length)
        s.skills = (
            <Mark key="skills" k="skills">
                {head(h.skills)}
                {groups.length ? (
                    <div className="grid grid-cols-[38%_62%] gap-x-0 gap-y-px">
                        {groups.map((g, i) => (
                            <SkillRow key={i} label={g.label} items={g.items} />
                        ))}
                    </div>
                ) : (
                    <div>{nonEmpty(...c.skills).join(', ')}</div>
                )}
            </Mark>
        )
    if (c.certifications.length)
        s.certifications = (
            <Mark key="certifications" k="certifications">
                {head(h.certifications)}
                {c.certifications.map((x, i) => (
                    <Row
                        key={i}
                        left={
                            <>
                                <Lnk url={x.url}><strong data-cv="etitle"><Rich text={x.name} /></strong></Lnk>
                                {x.issuer ? `, ${x.issuer}` : ''}
                            </>
                        }
                        right={<Meta t={x.year} />}
                    />
                ))}
            </Mark>
        )
    if (c.languages.length)
        s.languages = (
            <Mark key="languages" k="languages">
                {head(h.languages)}
                {c.languages.map((l, i) => {
                    const [name, level] = splitLanguage(l)
                    return <Row key={i} left={<strong>{name}</strong>} right={level} />
                })}
            </Mark>
        )
    extraSections(c, head, s)
    return (
        <div data-cv="body" className="flex flex-col gap-[7px]" style={{ padding: `${mmToPx(look.my)}px ${mmToPx(look.mx)}px`, fontSize: look.base }}>
            <Mark k="contact" head className={cn('flex gap-4', look.valign === 'top' ? 'items-start' : look.valign === 'bottom' ? 'items-end' : 'items-center', look.photoRight && 'flex-row-reverse')}>
                {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="h-[70px] w-[70px] flex-none rounded-full border-[1.5px] border-cv-blue object-cover" />
                ) : look.showPhoto ? (
                    <span
                        aria-hidden
                        className="flex h-[70px] w-[70px] flex-none items-center justify-center rounded-full border-[1.5px] border-cv-blue bg-cv-pale text-[21px] font-semibold text-cv-blue"
                    >
                        {initials(c.contact.name)}
                    </span>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <div className={cn('flex flex-wrap items-baseline gap-x-3', look.inlineTitle ? '' : 'flex-col gap-y-[3px]')}>
                        <span data-cv="name" className={cn('font-bold leading-[1.1] text-cv-blue', 'font-cv')} style={{ fontSize: look.name }}>
                            {c.contact.name}
                        </span>
                        {c.contact.headline ? (
                            <span
                                data-cv="title"
                                className={cn('text-cv-blue', look.inlineTitle ? 'italic' : 'tracking-[.02em] [font-variant:small-caps]')}
                                style={{ fontSize: look.title }}
                            >
                                {c.contact.headline}
                            </span>
                        ) : null}
                    </div>
                    <ContactLine c={c} phonePlaceholder={phonePlaceholder} linkClass="font-mono text-cv-blue" className="text-[9.5px] text-[#333]" />
                </div>
            </Mark>
            {inOrder(c, s)}
        </div>
    )
}

// ---- Moderne: dark side column, Source Serif 4 titles (Templates.dc.html) ----

const SIDE = new Set(['skills', 'languages'])

function Modern({ c, h, photoUrl, phonePlaceholder }: BodyProps) {
    const { look } = useContext(Ctx)
    const sideHead: Heading = (t) => <span className="mt-2 block text-[10px] font-bold uppercase tracking-[.08em]">{t}</span>
    const head: Heading = (t) => (
        <h3 data-cv="heading" className="m-0 mb-1 mt-2 font-cv font-bold text-cv-navy" style={{ fontSize: look.head }}>
            {t}
        </h3>
    )
    const groups = c.skill_groups ?? []
    const contact = contactParts(c, phonePlaceholder)
    const s: Sections = {}
    if (groups.length || c.skills.length)
        s.skills = (
            <Mark key="skills" k="skills" className="flex flex-col gap-[3px]">
                {sideHead(h.skills)}
                {groups.length
                    ? groups.map((g, i) => (
                          <span key={i}>
                              {g.label ? <strong className="block font-semibold">{g.label}</strong> : null}
                              {nonEmpty(...g.items).join(' · ')}
                          </span>
                      ))
                    : pairs(nonEmpty(...c.skills)).map((p, i) => <span key={i}>{p.join(' · ')}</span>)}
            </Mark>
        )
    if (c.languages.length)
        s.languages = (
            <Mark key="languages" k="languages" className="flex flex-col gap-[3px]">
                {sideHead(h.languages)}
                {c.languages.map((l, i) => (
                    <span key={i}>{join(' · ', ...splitLanguage(l))}</span>
                ))}
            </Mark>
        )
    if (c.summary.trim())
        s.summary = (
            <Mark key="summary" k="summary">
                {head(h.summary)}
                <Rich text={c.summary} />
            </Mark>
        )
    if (c.education.length)
        s.education = (
            <Mark key="education" k="education">
                {head(h.education)}
                {c.education.map((e, i) => (
                    <div key={i} className="mb-0.5">
                        <Row left={<Lnk url={e.url}><strong data-cv="etitle"><Rich text={join(' — ', e.school, e.degree)} /></strong></Lnk>} right={<span className="text-ink-3"><Meta t={dates(e.start, e.end)} /></span>} />
                        {e.location ? <div data-cv="loc" className="text-ink-3">{e.location}</div> : null}
                    </div>
                ))}
            </Mark>
        )
    if (c.experience.length)
        s.experience = (
            <Mark key="experience" k="experience">
                {head(h.experience)}
                {c.experience.map((e, i) => (
                    <div key={i} className="mb-0.5">
                        <Row left={<Lnk url={e.url}><strong data-cv="etitle"><Rich text={join(' — ', e.title, e.company)} /></strong></Lnk>} right={<span className="text-ink-3"><Meta t={dates(e.start, e.end)} /></span>} />
                        {join(' · ', e.kind, e.location) ? (
                        <div className="text-ink-3">
                            {e.kind}
                            {e.kind && e.location ? ' · ' : null}
                            {e.location ? <span data-cv="loc">{e.location}</span> : null}
                        </div>
                    ) : null}
                        <Bullets lines={e.description} />
                    </div>
                ))}
            </Mark>
        )
    if (c.projects?.length)
        s.projects = (
            <Mark key="projects" k="projects">
                {head(h.projects)}
                {c.projects.map((p, i) => (
                    <div key={i} className="mb-0.5">
                        <Row left={<Lnk url={p.url}><strong data-cv="etitle"><Rich text={p.name} /></strong></Lnk>} right={<span className="text-ink-3"><Meta t={p.year} /></span>} />
                        <Bullets lines={p.description} /><Tech p={p} />
                    </div>
                ))}
            </Mark>
        )
    if (c.certifications.length)
        s.certifications = (
            <Mark key="certifications" k="certifications">
                {head(h.certifications)}
                {c.certifications.map((x, i) => (
                    <Row
                        key={i}
                        left={
                            <>
                                <Lnk url={x.url}><strong data-cv="etitle"><Rich text={x.name} /></strong></Lnk>
                                <span className="text-ink-3">{x.issuer ? `, ${x.issuer}` : ''}</span>
                            </>
                        }
                        right={<span className="text-ink-3"><Meta t={x.year} /></span>}
                    />
                ))}
            </Mark>
        )
    extraSections(c, head, s)
    const py = mmToPx(look.my)
    return (
        <div className="flex" style={{ minHeight: BASE_H } as CSSProperties}>
            <div data-cv="body" className="box-border flex w-[34%] flex-none flex-col gap-[3px] bg-cv-navy px-[18px] text-[#E8ECF4]" style={{ paddingTop: py, paddingBottom: py, fontSize: look.base }}>
                {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="mb-1 h-[62px] w-[62px] self-center rounded-full object-cover" />
                ) : null}
                <Mark k="contact" className="flex flex-col gap-[3px]">
                    {contact.length ? sideHead(h.contact) : null}
                    {contact.map((p, i) => (
                        <span key={i} className={cn('break-words', p.kind === 'missing' && 'text-ember')}>
                            {p.text}
                        </span>
                    ))}
                </Mark>
                {inOrder(c, s, (k) => SIDE.has(k))}
            </div>
            <div data-cv="body" className="flex min-w-0 flex-1 flex-col gap-1 px-[24px]" style={{ paddingTop: py, paddingBottom: py, fontSize: look.base }}>
                <Mark k="contact" head>
                    <span data-cv="name" className={cn('block font-bold leading-[1.15] text-cv-navy', 'font-cv')} style={{ fontSize: look.name }}>
                        {c.contact.name}
                    </span>
                    {c.contact.headline ? (
                        <span data-cv="title" className="text-ink-3" style={{ fontSize: look.title }}>
                            {c.contact.headline}
                        </span>
                    ) : null}
                </Mark>
                {inOrder(c, s, (k) => !SIDE.has(k))}
            </div>
        </div>
    )
}

const pairs = (xs: string[]) => {
    const out: string[][] = []
    for (let i = 0; i < xs.length; i += 2) out.push(xs.slice(i, i + 2))
    return out
}

// ---- Compact: black and white, centred name, no photo ----

function Compact({ c, h, photoUrl, phonePlaceholder }: BodyProps) {
    const { look } = useContext(Ctx)
    const head: Heading = (t) => (
        <h3 data-cv="heading" className="m-0 mb-1 mt-1.5 border-b-[1.2px] border-[#111] font-cv font-bold uppercase text-[#111]" style={{ fontSize: look.head }}>
            {t}
        </h3>
    )
    const groups = c.skill_groups ?? []
    const s: Sections = {}
    if (c.summary.trim())
        s.summary = (
            <Mark key="summary" k="summary">
                {head(h.summary)}
                <Rich text={c.summary} />
            </Mark>
        )
    if (c.education.length)
        s.education = (
            <Mark key="education" k="education">
                {head(h.education)}
                {c.education.map((e, i) => (
                    <Row key={i} left={<Lnk url={e.url}><strong data-cv="etitle"><Rich text={join(' — ', e.school, e.degree)} /></strong></Lnk>} right={<Meta t={dates(e.start, e.end)} />} />
                ))}
            </Mark>
        )
    if (c.experience.length)
        s.experience = (
            <Mark key="experience" k="experience">
                {head(h.experience)}
                {c.experience.map((e, i) => (
                    <div key={i}>
                        <Row
                            left={
                                <>
                                    <Lnk url={e.url}><strong data-cv="etitle"><Rich text={join(' : ', e.company, e.title)} /></strong></Lnk>
                                    {e.location ? <span data-cv="loc">{`, ${e.location}`}</span> : null}
                                </>
                            }
                            right={<Meta t={dates(e.start, e.end)} />}
                        />
                        <Bullets lines={e.description} />
                    </div>
                ))}
            </Mark>
        )
    if (c.projects?.length)
        s.projects = (
            <Mark key="projects" k="projects">
                {head(h.projects)}
                {c.projects.map((p, i) => (
                    <div key={i}>
                        <Row
                            left={
                                <>
                                    <Lnk url={p.url}><strong data-cv="etitle"><Rich text={p.name} /></strong></Lnk>
                                </>
                            }
                            right={<Meta t={p.year} />}
                        />
                        <Bullets lines={p.description} /><Tech p={p} />
                    </div>
                ))}
            </Mark>
        )
    if (groups.length || c.skills.length)
        s.skills = (
            <Mark key="skills" k="skills">
                {head(h.skills)}
                {groups.length ? (
                    groups.map((g, i) => (
                        <div key={i}>
                            {g.label ? <strong>{g.label} : </strong> : null}
                            {nonEmpty(...g.items).join(', ')}
                        </div>
                    ))
                ) : (
                    <div>{nonEmpty(...c.skills).join(', ')}</div>
                )}
            </Mark>
        )
    if (c.certifications.length)
        s.certifications = (
            <Mark key="certifications" k="certifications">
                {head(h.certifications)}
                {c.certifications.map((x, i) => (
                    <Row
                        key={i}
                        left={
                            <>
                                <Lnk url={x.url}><strong data-cv="etitle"><Rich text={x.name} /></strong></Lnk>
                                {x.issuer ? `, ${x.issuer}` : ''}
                            </>
                        }
                        right={<Meta t={x.year} />}
                    />
                ))}
            </Mark>
        )
    if (c.languages.length)
        s.languages = (
            <Mark key="languages" k="languages">
                {head(h.languages)}
                <div>
                    {c.languages
                        .map((l) => {
                            const [n, lv] = splitLanguage(l)
                            return lv ? `${n} (${lv})` : n
                        })
                        .join(' · ')}
                </div>
            </Mark>
        )
    extraSections(c, head, s)
    return (
        <div data-cv="body" className="flex flex-col gap-[3px] text-[#111]" style={{ padding: `${mmToPx(look.my)}px ${mmToPx(look.mx)}px`, fontSize: look.base }}>
            <Mark k="contact" head className={cn('flex gap-4', look.valign === 'top' ? 'items-start' : look.valign === 'bottom' ? 'items-end' : 'items-center', look.photoRight && 'flex-row-reverse')}>
                {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="h-[62px] w-[62px] flex-none rounded-full object-cover" />
                ) : null}
                <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', look.center ? 'items-center text-center' : 'items-start text-start')}>
                    <span data-cv="name" className={cn('font-bold uppercase tracking-[.06em]', 'font-cv')} style={{ fontSize: look.name }}>
                        {c.contact.name}
                    </span>
                    {c.contact.headline ? (
                        <span data-cv="title" className="text-[#444]" style={{ fontSize: look.title }}>
                            {c.contact.headline}
                        </span>
                    ) : null}
                    <ContactLine c={c} phonePlaceholder={phonePlaceholder} className="text-[9.5px] text-[#444]" />
                </div>
            </Mark>
            {inOrder(c, s)}
        </div>
    )
}
