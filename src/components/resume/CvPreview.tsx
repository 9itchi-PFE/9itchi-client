'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { entryArrangement, entryDefault, groupRoles, lookCss, mmToPx, resolveLook, skillSep, type EntryArrangement, type Look } from '@/lib/cvLook'
import { LOC_MARK, visibleEntries, visibleSections, type Experience, type Layout, type ResumeContent } from '@/types/resume'
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

// CvPreview renders the CV as the templates of screen 4.3 (and the two-column ones after them) draw it, the same way the PDF export does.
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

    const Body = layout === 'compact' ? Compact : Classic
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
                    {isTwoColumn(layout) ? (
                        <TwoColumns
                            c={shown}
                            h={cvHeadings[language]}
                            photoUrl={look.showPhoto ? photoUrl : null}
                            phonePlaceholder={phonePlaceholder}
                            layout={layout}
                        />
                    ) : (
                        <Body c={shown} h={cvHeadings[language]} photoUrl={look.showPhoto ? photoUrl : null} phonePlaceholder={phonePlaceholder} />
                    )}
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
            className={cn(className, on && 'rounded-sm bg-[#FBFAFF] outline outline-[1.5px] outline-offset-4 outline-violet [[data-fill]_&]:bg-white/10')}
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

type EntryHeadProps = {
    arrange: EntryArrangement
    title: string
    sub: string
    kind?: string
    url?: string
    start?: string
    end?: string
    location?: string
    subClass?: string
    plainSub?: boolean // the template never paints the subtitle in the accent (as the PDF does for Modern); its text style still applies
}

// EntryHead is the head of a job or a study once the style says how the title and the company/school sit: on one line or one above the other, either first.
// The kind (internship, full-time...) stays with the company, as in the exports.
function EntryHead({ arrange, title, sub, kind, url, start, end, location, subClass, plainSub }: EntryHeadProps) {
    const subCv = plainSub ? 'psub' : 'sub'
    const when = <Meta t={dates(start, end)} />
    const company = kind ? `${sub} (${kind})` : sub
    if (arrange.inline) {
        // "First, second" as in the exports: the first bold, the second in the subtitle style.
        const [lead, rest] = arrange.subtitleFirst ? [company, title] : [title, company]
        const second = rest.trim() ? (
            <span data-cv={subCv} className={subClass}>
                <Rich text={lead.trim() ? `, ${rest}` : rest} />
            </span>
        ) : null
        const loc = location ? <span data-cv="loc">{`, ${location}`}</span> : null
        return (
            <Row
                left={
                    <>
                        <Lnk url={url}>
                            <strong data-cv="etitle">
                                <Rich text={lead} />
                            </strong>
                        </Lnk>
                        {second}
                        {loc}
                    </>
                }
                right={when}
            />
        )
    }
    const [first, second] = arrange.subtitleFirst ? ([company, title] as const) : ([title, company] as const)
    const [firstRole, secondRole] = arrange.subtitleFirst ? (['sub', 'etitle'] as const) : (['etitle', 'sub'] as const)
    const cls = (role: 'sub' | 'etitle') => (role === 'sub' ? subClass : undefined)
    return (
        <>
            <Row left={<Lnk url={url}><strong data-cv={firstRole === 'sub' ? subCv : firstRole} className={cls(firstRole)}><Rich text={first} /></strong></Lnk>} right={when} />
            {second.trim() || location ? (
                <Row left={<span data-cv={secondRole === 'sub' ? subCv : secondRole} className={cls(secondRole)}><Rich text={second} /></span>} right={<Meta t={location} k="loc" />} />
            ) : null}
        </>
    )
}

// RoleGroup prints several roles held in a row at the same company: the company once, then each role indented along a thin line.
function RoleGroup({ roles }: { roles: Experience[] }) {
    const first = roles[0]
    return (
        <>
            <Row
                left={
                    <Lnk url={first.url}>
                        <strong data-cv="etitle">
                            <Rich text={first.company} />
                        </strong>
                    </Lnk>
                }
            />
            <div data-cv="roles" className="ms-[3px] border-0 border-s border-solid border-[#C8C8C8] ps-[10px]">
                {roles.map((r, i) => (
                    <div key={i} className={cn(i > 0 && 'mt-[3px]')}>
                        <Row
                            left={
                                <>
                                    <Lnk url={r.url}>
                                        <strong data-cv="etitle">
                                            <Rich text={r.title} />
                                        </strong>
                                    </Lnk>
                                    {r.kind ? ` (${r.kind})` : ''}
                                    {r.location ? <span data-cv="loc">{`, ${r.location}`}</span> : null}
                                </>
                            }
                            right={<Meta t={dates(r.start, r.end)} />}
                        />
                        <Bullets lines={r.description} />
                    </div>
                ))}
            </div>
        </>
    )
}

// Languages on one line: <strong>English</strong> (professional), <strong>French</strong> (professional).
const LanguagesInline = ({ list }: { list: string[] }) => (
    <div>
        {list.map((l, i) => {
            const [name, level] = splitLanguage(l)
            return (
                <span key={i}>
                    {i > 0 ? ', ' : ''}
                    <strong>{name}</strong>
                    {level ? ` (${level})` : ''}
                </span>
            )
        })}
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

const ContactIcon = ({ kind, className }: { kind: ContactKind; className?: string }) => (
    <svg aria-hidden width="1.05em" height="1.05em" viewBox="0 0 24 24" fill="currentColor" className={cn('flex-none', className)}>
        <path d={CONTACT_ICONS[kind]} />
    </svg>
)

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

function ContactLine({ c, phonePlaceholder, linkClass, iconClass, className }: { c: ResumeContent; phonePlaceholder?: string; linkClass?: string; iconClass?: string; className?: string }) {
    const { look } = useContext(Ctx)
    if (look.icons)
        return (
            <span className={cn('flex flex-wrap items-center gap-x-6 gap-y-1', className)}>
                {contactParts(c, phonePlaceholder).map((p, i) => (
                    <span key={i} className={cn('inline-flex items-center gap-1.5', p.kind === 'missing' && 'text-warn-fg')}>
                        <ContactIcon kind={p.icon} className={iconClass ?? 'text-[#111]'} />
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

const SkillRow = ({ label, items, sep }: { label: string; items: string[]; sep: string }) => (
    <>
        <strong>{label}</strong>
        <span>{nonEmpty(...items).join(sep)}</span>
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
    const eduArr = entryArrangement('classic', 'education', c.style)
    const expArr = entryArrangement('classic', 'experience', c.style)
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
                        {eduArr ? (
                            <EntryHead arrange={eduArr} title={e.degree} sub={e.school} url={e.url} start={e.start} end={e.end} location={e.location} subClass="text-cv-blue" />
                        ) : (
                            <>
                                <Row left={<Lnk url={e.url}><strong data-cv="etitle"><Rich text={e.degree} /></strong></Lnk>} right={<Meta t={dates(e.start, e.end)} />} />
                                <Row left={<span data-cv="sub"><Rich text={e.school} /></span>} right={<Meta t={e.location} k="loc" />} />
                            </>
                        )}
                    </div>
                ))}
            </Mark>
        )
    if (c.experience.length)
        s.experience = (
            <Mark key="experience" k="experience">
                {head(h.experience)}
                {groupRoles(c.experience, c.style?.group_roles).map(([e, ...more], i) => (
                    <div key={i} className={cn(i > 0 && 'mt-[3px]')}>
                        {more.length ? (
                            <RoleGroup roles={[e, ...more]} />
                        ) : expArr ? (
                            <EntryHead arrange={expArr} title={e.title} sub={e.company} kind={e.kind} url={e.url} start={e.start} end={e.end} location={e.location} subClass="text-cv-blue" />
                        ) : (
                            <>
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
                            </>
                        )}
                        {more.length ? null : <Bullets lines={e.description} />}
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
                            <SkillRow key={i} label={g.label} items={g.items} sep={skillSep(c.style, ', ')} />
                        ))}
                    </div>
                ) : (
                    <div>{nonEmpty(...c.skills).join(skillSep(c.style, ', '))}</div>
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
                {c.style?.languages_style === 'inline' ? (
                    <LanguagesInline list={c.languages} />
                ) : (
                    c.languages.map((l, i) => {
                        const [name, level] = splitLanguage(l)
                        return <Row key={i} left={<strong>{name}</strong>} right={level} />
                    })
                )}
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
                    <ContactLine c={c} phonePlaceholder={phonePlaceholder} linkClass="text-cv-blue" className="text-[9.5px] text-[#333]" />
                </div>
            </Mark>
            {inOrder(c, s)}
        </div>
    )
}

// ---- Two columns: Moderne (dark side column, Source Serif 4 titles, Templates.dc.html), Sidebar, Split and Banner ----

type TwoColumnLayout = 'modern' | 'sidebar' | 'split' | 'banner'

// TwoColumnSpec is what tells the two-column templates apart; the sections themselves are drawn once, in the user's order within each column.
type TwoColumnSpec = {
    side: ReadonlySet<string> // sections of the narrow column; the others go in the main one
    sideEnd?: boolean // the narrow column sits after the main one (on the right)
    top?: 'plain' | 'band' // name, title and contacts across the page above the columns; unset: name atop the main column, contacts in the narrow one
    sideCls: string
    mainCls: string
    fill?: string // color of the filled area (the narrow column, or the band) when no accent is chosen; the accent replaces it
    mx?: boolean // the margin option pads the page edges; Modern keeps its fixed padding
    sideMargin?: boolean // the margin pads the narrow column's outer edge too (it is not filled)
    head: string // a section heading of the main column
    sideHead?: string // a section heading of the narrow column; unset: Modern's small plain label
    muted: string // dates and issuers next to an entry
    sideMuted: string
    name: string
    title: string
    tint?: string // the template's own color for subtitles
    ownEntries?: boolean // entries keep the shared stacked head (entryDefault) rather than Modern's own lines
    photoEnd?: boolean // the photo sits at the end of the header unless the style places it
    plainSub?: boolean // the accent never reaches subtitles, as in the PDF
}

const SIDE = new Set(['skills', 'languages'])
const sideHeading = (color: string) => `m-0 mb-1 mt-2 border-b pb-px font-cv font-bold uppercase tracking-[.04em] ${color}`

const TWO_COLUMNS: Record<TwoColumnLayout, TwoColumnSpec> = {
    modern: {
        side: SIDE,
        sideCls: 'w-[34%] gap-[3px] bg-cv-navy px-[18px] text-[#E8ECF4]',
        mainCls: 'gap-1 px-[24px]',
        head: 'm-0 mb-1 mt-2 border-current font-cv font-bold text-cv-navy',
        muted: 'text-ink-3',
        sideMuted: 'text-ink-3',
        name: 'text-cv-navy',
        title: 'text-ink-3',
        plainSub: true,
    },
    sidebar: {
        side: new Set(['skills', 'languages', 'certifications']),
        sideCls: 'w-[33%] gap-[3px] px-[16px] text-white',
        mainCls: 'gap-1 ps-[20px]',
        fill: '#1F3A5F',
        mx: true,
        head: sideHeading('border-[#1F3A5F] text-[#1F3A5F]'),
        sideHead: sideHeading('border-white/60 text-white'),
        muted: 'text-ink-3',
        sideMuted: 'text-white/80',
        name: 'text-[#1F3A5F]',
        title: 'text-ink-3',
        tint: 'text-[#1F3A5F]',
        ownEntries: true,
    },
    split: {
        side: new Set(['education', 'skills', 'languages', 'certifications']),
        sideEnd: true,
        sideMargin: true,
        top: 'plain',
        sideCls: 'w-[36%] gap-1 border-0 border-s border-solid border-[#D9D9D9] ps-[14px]',
        mainCls: 'gap-1 pe-[14px]',
        mx: true,
        head: sideHeading('border-[#2E6B5E] text-[#2E6B5E]'),
        sideHead: sideHeading('border-[#2E6B5E] text-[#2E6B5E]'),
        muted: 'text-ink-3',
        sideMuted: 'text-ink-3',
        name: 'text-[#2E6B5E]',
        title: 'text-ink-3',
        tint: 'text-[#2E6B5E]',
        ownEntries: true,
    },
    banner: {
        side: new Set(['education', 'skills', 'languages', 'certifications']),
        top: 'band',
        sideCls: 'w-[32%] gap-1 bg-[#F3F4F6] px-[14px]',
        mainCls: 'gap-1 ps-[16px]',
        fill: '#7A2E3B',
        mx: true,
        head: sideHeading('border-[#7A2E3B] text-[#7A2E3B]'),
        sideHead: sideHeading('border-[#7A2E3B] text-[#7A2E3B]'),
        muted: 'text-ink-3',
        sideMuted: 'text-ink-3',
        name: 'text-white',
        title: 'text-white/80',
        tint: 'text-[#7A2E3B]',
        ownEntries: true,
        photoEnd: true,
    },
}

const isTwoColumn = (l: Layout): l is TwoColumnLayout => Object.prototype.hasOwnProperty.call(TWO_COLUMNS, l)

function TwoColumns({ c, h, photoUrl, phonePlaceholder, layout }: BodyProps & { layout: TwoColumnLayout }) {
    const { look } = useContext(Ctx)
    const spec = TWO_COLUMNS[layout]
    const own = (section: 'education' | 'experience') => entryArrangement(layout, section, c.style) ?? (spec.ownEntries ? entryDefault(layout, section) : null)
    const eduArr = own('education')
    const expArr = own('experience')
    const plainHead: Heading = (t) => <span className="mt-2 block text-[10px] font-bold uppercase tracking-[.08em]">{t}</span>
    const h3 = (cls: string, t: string) => (
        <h3 data-cv="heading" className={cls} style={{ fontSize: look.head }}>
            {t}
        </h3>
    )
    const mainHead: Heading = (t) => h3(spec.head, t)
    const sideCls = spec.sideHead
    const sideHead: Heading = sideCls ? (t) => h3(sideCls, t) : plainHead
    const inSide = (k: string) => spec.side.has(k)
    const head = (k: string) => (inSide(k) ? sideHead : mainHead)
    const muted = (k: string) => (inSide(k) ? spec.sideMuted : spec.muted)
    const groups = c.skill_groups ?? []
    const contact = contactParts(c, phonePlaceholder)
    const s: Sections = {}
    if (groups.length || c.skills.length)
        s.skills = (
            <Mark key="skills" k="skills" className="flex flex-col gap-[3px]">
                {head('skills')(h.skills)}
                {groups.length
                    ? groups.map((g, i) => (
                          <span key={i}>
                              {g.label ? <strong className="block font-semibold">{g.label}</strong> : null}
                              {nonEmpty(...g.items).join(skillSep(c.style, ' · '))}
                          </span>
                      ))
                    : pairs(nonEmpty(...c.skills)).map((p, i) => <span key={i}>{p.join(skillSep(c.style, ' · '))}</span>)}
            </Mark>
        )
    if (c.languages.length)
        s.languages = (
            <Mark key="languages" k="languages" className="flex flex-col gap-[3px]">
                {head('languages')(h.languages)}
                {c.style?.languages_style === 'inline' ? (
                    <LanguagesInline list={c.languages} />
                ) : (
                    c.languages.map((l, i) => <span key={i}>{join(' · ', ...splitLanguage(l))}</span>)
                )}
            </Mark>
        )
    if (c.summary.trim())
        s.summary = (
            <Mark key="summary" k="summary">
                {head('summary')(h.summary)}
                <Rich text={c.summary} />
            </Mark>
        )
    if (c.education.length)
        s.education = (
            <Mark key="education" k="education">
                {head('education')(h.education)}
                {c.education.map((e, i) => (
                    <div key={i} className="mb-0.5">
                        {eduArr ? (
                            <EntryHead
                                arrange={eduArr}
                                title={e.degree}
                                sub={e.school}
                                url={e.url}
                                start={e.start}
                                end={e.end}
                                location={e.location}
                                subClass={spec.tint}
                                plainSub={spec.plainSub}
                            />
                        ) : (
                            <>
                                <Row
                                    left={
                                        <Lnk url={e.url}>
                                            <strong data-cv="etitle">
                                                <Rich text={join(' — ', e.school, e.degree)} />
                                            </strong>
                                        </Lnk>
                                    }
                                    right={
                                        <span className={muted('education')}>
                                            <Meta t={dates(e.start, e.end)} />
                                        </span>
                                    }
                                />
                                {e.location ? (
                                    <div data-cv="loc" className={muted('education')}>
                                        {e.location}
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                ))}
            </Mark>
        )
    if (c.experience.length)
        s.experience = (
            <Mark key="experience" k="experience">
                {head('experience')(h.experience)}
                {groupRoles(c.experience, c.style?.group_roles).map(([e, ...more], i) => (
                    <div key={i} className="mb-0.5">
                        {more.length ? (
                            <RoleGroup roles={[e, ...more]} />
                        ) : expArr ? (
                            <EntryHead
                                arrange={expArr}
                                title={e.title}
                                sub={e.company}
                                kind={e.kind}
                                url={e.url}
                                start={e.start}
                                end={e.end}
                                location={e.location}
                                subClass={spec.tint}
                                plainSub={spec.plainSub}
                            />
                        ) : (
                            <>
                                <Row
                                    left={
                                        <Lnk url={e.url}>
                                            <strong data-cv="etitle">
                                                <Rich text={join(' — ', e.title, e.company)} />
                                            </strong>
                                        </Lnk>
                                    }
                                    right={
                                        <span className={muted('experience')}>
                                            <Meta t={dates(e.start, e.end)} />
                                        </span>
                                    }
                                />
                                {join(' · ', e.kind, e.location) ? (
                                    <div className={muted('experience')}>
                                        {e.kind}
                                        {e.kind && e.location ? ' · ' : null}
                                        {e.location ? <span data-cv="loc">{e.location}</span> : null}
                                    </div>
                                ) : null}
                            </>
                        )}
                        {more.length ? null : <Bullets lines={e.description} />}
                    </div>
                ))}
            </Mark>
        )
    if (c.projects?.length)
        s.projects = (
            <Mark key="projects" k="projects">
                {head('projects')(h.projects)}
                {c.projects.map((p, i) => (
                    <div key={i} className="mb-0.5">
                        <Row
                            left={
                                <Lnk url={p.url}>
                                    <strong data-cv="etitle">
                                        <Rich text={p.name} />
                                    </strong>
                                </Lnk>
                            }
                            right={
                                <span className={muted('projects')}>
                                    <Meta t={p.year} />
                                </span>
                            }
                        />
                        <Bullets lines={p.description} />
                        <Tech p={p} />
                    </div>
                ))}
            </Mark>
        )
    if (c.certifications.length)
        s.certifications = (
            <Mark key="certifications" k="certifications">
                {head('certifications')(h.certifications)}
                {c.certifications.map((x, i) => (
                    <Row
                        key={i}
                        left={
                            <>
                                <Lnk url={x.url}>
                                    <strong data-cv="etitle">
                                        <Rich text={x.name} />
                                    </strong>
                                </Lnk>
                                <span className={muted('certifications')}>{x.issuer ? `, ${x.issuer}` : ''}</span>
                            </>
                        }
                        right={
                            <span className={muted('certifications')}>
                                <Meta t={x.year} />
                            </span>
                        }
                    />
                ))}
            </Mark>
        )
    extraSections(c, mainHead, s)
    const py = mmToPx(look.my)
    const px = spec.mx ? mmToPx(look.mx) : undefined
    const fill = spec.fill ? (look.accent ?? spec.fill) : undefined
    const photoRight = c.style?.photo_position ? c.style.photo_position === 'right' : !!spec.photoEnd
    const nameLine = (
        <>
            <span data-cv="name" className={cn('block font-bold leading-[1.15]', spec.name, 'font-cv')} style={{ fontSize: look.name }}>
                {c.contact.name}
            </span>
            {c.contact.headline ? (
                <span data-cv="title" className={spec.title} style={{ fontSize: look.title }}>
                    {c.contact.headline}
                </span>
            ) : null}
        </>
    )
    // a filled narrow column runs down the page to its edge with its own padding; the margin pads the other edges
    const sideFilled = !spec.top && !!fill
    const sidePad: CSSProperties = spec.sideMargin ? (spec.sideEnd ? { paddingInlineEnd: px } : { paddingInlineStart: px }) : {}
    const mainPad: CSSProperties = spec.mx ? (spec.sideEnd ? { paddingInlineStart: px } : { paddingInlineEnd: px }) : {}
    const colTop = spec.top ? mmToPx(4) : py
    const side = (
        <div
            data-cv="body"
            data-fill={sideFilled || layout === 'modern' || undefined}
            className={cn('box-border flex flex-none flex-col', spec.sideCls)}
            style={{ paddingTop: colTop, paddingBottom: py, fontSize: look.base, background: sideFilled ? fill : undefined, ...sidePad }}
        >
            {spec.top ? null : (
                <>
                    {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={photoUrl}
                            alt=""
                            className={cn(
                                'self-center rounded-full object-cover',
                                layout === 'modern' ? 'mb-1 h-[62px] w-[62px]' : 'mb-2 h-[76px] w-[76px] border-2 border-solid border-white/80',
                            )}
                        />
                    ) : null}
                    {layout === 'modern' ? (
                        <Mark k="contact" className="flex flex-col gap-[3px]">
                            {contact.length ? plainHead(h.contact) : null}
                            {contact.map((p, i) => (
                                <span key={i} className={cn('break-words', p.kind === 'missing' && 'text-ember')}>
                                    {p.text}
                                </span>
                            ))}
                        </Mark>
                    ) : (
                        <Mark k="contact" className="flex flex-col gap-1">
                            {contact.map((p, i) => (
                                <span key={i} className={cn('flex min-w-0 items-start gap-1.5', p.kind === 'missing' && 'text-ember')}>
                                    {look.icons ? <ContactIcon kind={p.icon} className="mt-[.15em]" /> : null}
                                    <span data-cv={p.kind === 'link' ? 'link' : undefined} className="min-w-0 break-words">
                                        {p.text}
                                    </span>
                                </span>
                            ))}
                        </Mark>
                    )}
                </>
            )}
            {inOrder(c, s, inSide)}
        </div>
    )
    const main = (
        <div
            data-cv="body"
            className={cn('flex min-w-0 flex-1 flex-col', spec.mainCls)}
            style={{ paddingTop: colTop, paddingBottom: py, fontSize: look.base, ...mainPad }}
        >
            {spec.top ? null : (
                <Mark k="contact" head>
                    {nameLine}
                </Mark>
            )}
            {inOrder(c, s, (k) => !inSide(k))}
        </div>
    )
    if (!spec.top)
        return (
            <div className="flex" style={{ minHeight: BASE_H } as CSSProperties}>
                {side}
                {main}
            </div>
        )
    const band = spec.top === 'band'
    return (
        <div className="flex flex-col" style={{ minHeight: BASE_H } as CSSProperties}>
            <div
                data-fill={band || undefined}
                className={cn(band && 'text-white')}
                style={{ background: band ? fill : undefined, padding: `${py}px ${px}px ${band ? py * 0.6 : 0}px` }}
            >
                <Mark
                    k="contact"
                    head
                    className={cn(
                        'flex gap-4',
                        look.valign === 'top' ? 'items-start' : look.valign === 'bottom' ? 'items-end' : 'items-center',
                        photoRight && 'flex-row-reverse',
                    )}
                >
                    {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={photoUrl}
                            alt=""
                            className={cn('h-[70px] w-[70px] flex-none rounded-full object-cover', band && 'border-2 border-solid border-white/80')}
                        />
                    ) : null}
                    <div className={cn('flex min-w-0 flex-1 flex-col gap-[3px]', look.center ? 'items-center text-center' : 'items-start text-start')}>
                        <div
                            className={cn(
                                'flex flex-wrap items-baseline gap-x-3',
                                look.inlineTitle ? '' : 'flex-col gap-y-[3px]',
                                look.center && 'justify-center',
                            )}
                        >
                            {nameLine}
                        </div>
                        <ContactLine
                            c={c}
                            phonePlaceholder={phonePlaceholder}
                            iconClass={band ? 'text-white' : undefined}
                            className={cn('text-[9.5px]', band ? 'text-white/90' : 'text-[#333]')}
                        />
                    </div>
                </Mark>
            </div>
            <div className="flex flex-1">
                {spec.sideEnd ? main : side}
                {spec.sideEnd ? side : main}
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
    const eduArr = entryArrangement('compact', 'education', c.style)
    const expArr = entryArrangement('compact', 'experience', c.style)
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
                {c.education.map((e, i) =>
                    eduArr ? (
                        <EntryHead key={i} arrange={eduArr} title={e.degree} sub={e.school} url={e.url} start={e.start} end={e.end} location={e.location} />
                    ) : (
                        <Row key={i} left={<Lnk url={e.url}><strong data-cv="etitle"><Rich text={join(' — ', e.school, e.degree)} /></strong></Lnk>} right={<Meta t={dates(e.start, e.end)} />} />
                    ),
                )}
            </Mark>
        )
    if (c.experience.length)
        s.experience = (
            <Mark key="experience" k="experience">
                {head(h.experience)}
                {groupRoles(c.experience, c.style?.group_roles).map(([e, ...more], i) => (
                    <div key={i}>
                        {more.length ? (
                            <RoleGroup roles={[e, ...more]} />
                        ) : expArr ? (
                            <EntryHead arrange={expArr} title={e.title} sub={e.company} kind={e.kind} url={e.url} start={e.start} end={e.end} location={e.location} />
                        ) : (
                            <Row
                                left={
                                    <>
                                        <Lnk url={e.url}><strong data-cv="etitle"><Rich text={join(' : ', e.company, e.title)} /></strong></Lnk>
                                        {e.location ? <span data-cv="loc">{`, ${e.location}`}</span> : null}
                                    </>
                                }
                                right={<Meta t={dates(e.start, e.end)} />}
                            />
                        )}
                        {more.length ? null : <Bullets lines={e.description} />}
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
                            {nonEmpty(...g.items).join(skillSep(c.style, ', '))}
                        </div>
                    ))
                ) : (
                    <div>{nonEmpty(...c.skills).join(skillSep(c.style, ', '))}</div>
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
                {c.style?.languages_style === 'inline' ? (
                    <LanguagesInline list={c.languages} />
                ) : (
                    <div>
                        {c.languages
                            .map((l) => {
                                const [n, lv] = splitLanguage(l)
                                return lv ? `${n} (${lv})` : n
                            })
                            .join(' · ')}
                    </div>
                )}
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
