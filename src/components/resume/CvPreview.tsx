'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { lookCss, mmToPx, resolveLook, type Look } from '@/lib/cvLook'
import { sectionOrder, type Layout, type ResumeContent } from '@/types/resume'
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

const Ctx = createContext<{ highlight?: SectionKey; look: Look }>({ look: resolveLook('classic') })

// CvPreview renders the CV as the three templates of screen 4.3 draw it, the same way the PDF export does.
export default function CvPreview({ content, layout, language, photoUrl, highlight, phonePlaceholder, onPages, className, ariaLabel }: Props) {
    const box = useRef<HTMLDivElement>(null)
    const paper = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const [height, setHeight] = useState(BASE_H)
    const look = useMemo(() => resolveLook(layout, content.style), [layout, content.style])
    const css = useMemo(() => lookCss(look, content.style), [look, content.style])

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
                <Ctx.Provider value={{ highlight, look }}>
                    <Body c={content} h={cvHeadings[language]} photoUrl={look.showPhoto ? photoUrl : null} phonePlaceholder={phonePlaceholder} />
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

const Row = ({ left, right, className }: { left: ReactNode; right?: ReactNode; className?: string }) => (
    <div data-cv="row" className={cn('flex justify-between gap-2.5', className)}>
        <span className="min-w-0">{left}</span>
        {right ? <span className="flex-none text-end">{right}</span> : null}
    </div>
)

const Bullets = ({ lines }: { lines: string[] }) => {
    const l = nonEmpty(...lines)
    if (!l.length) return null
    return (
        <ul className="m-0 mb-[3px] mt-px list-disc ps-3.5">
            {l.map((x, i) => (
                <li key={i}>{x}</li>
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

function contactParts(c: ResumeContent, phonePlaceholder?: string) {
    const parts: { text: string; kind: 'plain' | 'link' | 'missing' }[] = []
    if (c.contact.email) parts.push({ text: c.contact.email, kind: 'plain' })
    if (c.contact.phone) parts.push({ text: c.contact.phone, kind: 'plain' })
    else if (phonePlaceholder) parts.push({ text: phonePlaceholder, kind: 'missing' })
    if (c.contact.location) parts.push({ text: c.contact.location, kind: 'plain' })
    for (const l of nonEmpty(...c.contact.links)) parts.push({ text: shortLink(l), kind: 'link' })
    return parts
}

function ContactLine({ c, phonePlaceholder, linkClass, className }: { c: ResumeContent; phonePlaceholder?: string; linkClass?: string; className?: string }) {
    const { look } = useContext(Ctx)
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
    sectionOrder(c)
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
            <Mark key="summary" k="summary" className="border-t border-cv-blue pt-[5px]">
                {c.summary}
            </Mark>
        )
    if (c.education.length)
        s.education = (
            <Mark key="education" k="education">
                {head(h.education)}
                {c.education.map((e, i) => (
                    <div key={i} className={cn(i > 0 && 'mt-[3px]')}>
                        <Row left={<strong>{e.degree}</strong>} right={dates(e.start, e.end)} />
                        <Row left={e.school} right={e.location} />
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
                        <Row left={<strong>{e.title}</strong>} right={<strong>{dates(e.start, e.end)}</strong>} />
                        <Row
                            left={
                                <>
                                    <span className="text-cv-blue">{e.company}</span>
                                    {e.kind ? ` (${e.kind})` : ''}
                                </>
                            }
                            right={e.location}
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
                        <Row left={<strong>{p.name}</strong>} right={join(' · ', p.tech, p.year)} />
                        <Bullets lines={p.description} />
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
                                <strong>{x.name}</strong>
                                {x.issuer ? `, ${x.issuer}` : ''}
                            </>
                        }
                        right={x.year}
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
            <Mark k="contact" head className="flex items-center gap-4">
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
                    <span data-cv="name" className={cn('font-bold leading-[1.1] text-[#111]', look.nameSerif ? 'font-cvserif' : 'font-cv')} style={{ fontSize: look.name }}>
                        {c.contact.name}
                    </span>
                    {c.contact.headline ? (
                        <span data-cv="title" className="tracking-[.02em] text-cv-blue [font-variant:small-caps]" style={{ fontSize: look.title }}>
                            {c.contact.headline}
                        </span>
                    ) : null}
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
        <h3 data-cv="heading" className="m-0 mb-1 mt-2 font-cvserif font-bold text-cv-navy" style={{ fontSize: look.head }}>
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
            <Mark key="summary" k="summary" className="mt-1">
                {c.summary}
            </Mark>
        )
    if (c.education.length)
        s.education = (
            <Mark key="education" k="education">
                {head(h.education)}
                {c.education.map((e, i) => (
                    <div key={i} className="mb-0.5">
                        <Row left={<strong>{join(' — ', e.school, e.degree)}</strong>} right={<span className="text-ink-3">{dates(e.start, e.end)}</span>} />
                        {e.location ? <div className="text-ink-3">{e.location}</div> : null}
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
                        <Row left={<strong>{join(' — ', e.title, e.company)}</strong>} right={<span className="text-ink-3">{dates(e.start, e.end)}</span>} />
                        {join(' · ', e.kind, e.location) ? <div className="text-ink-3">{join(' · ', e.kind, e.location)}</div> : null}
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
                        <Row left={<strong>{p.name}</strong>} right={<span className="text-ink-3">{join(' · ', p.tech, p.year)}</span>} />
                        <Bullets lines={p.description} />
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
                                <strong>{x.name}</strong>
                                <span className="text-ink-3">{x.issuer ? `, ${x.issuer}` : ''}</span>
                            </>
                        }
                        right={<span className="text-ink-3">{x.year}</span>}
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
                    <span data-cv="name" className={cn('block font-bold leading-[1.15] text-cv-navy', look.nameSerif ? 'font-cvserif' : 'font-cv')} style={{ fontSize: look.name }}>
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

function Compact({ c, h, phonePlaceholder }: BodyProps) {
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
            <Mark key="summary" k="summary" className="mt-1">
                {c.summary}
            </Mark>
        )
    if (c.education.length)
        s.education = (
            <Mark key="education" k="education">
                {head(h.education)}
                {c.education.map((e, i) => (
                    <Row key={i} left={<strong>{join(' — ', e.school, e.degree)}</strong>} right={dates(e.start, e.end)} />
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
                                    <strong>{join(' : ', e.company, e.title)}</strong>
                                    {e.location ? `, ${e.location}` : ''}
                                </>
                            }
                            right={dates(e.start, e.end)}
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
                                    <strong>{p.name}</strong>
                                    {p.tech ? ` · ${p.tech}` : ''}
                                </>
                            }
                            right={p.year}
                        />
                        <Bullets lines={p.description} />
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
                                <strong>{x.name}</strong>
                                {x.issuer ? `, ${x.issuer}` : ''}
                            </>
                        }
                        right={x.year}
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
            <Mark k="contact" head className={cn('flex flex-col gap-0.5', look.center ? 'items-center text-center' : 'items-start text-start')}>
                <span data-cv="name" className={cn('font-bold uppercase tracking-[.06em]', look.nameSerif && 'font-cvserif')} style={{ fontSize: look.name }}>
                    {c.contact.name}
                </span>
                {c.contact.headline ? (
                    <span data-cv="title" className="text-[#444]" style={{ fontSize: look.title }}>
                        {c.contact.headline}
                    </span>
                ) : null}
                <ContactLine c={c} phonePlaceholder={phonePlaceholder} className="text-[9.5px] text-[#444]" />
            </Mark>
            {inOrder(c, s)}
        </div>
    )
}
