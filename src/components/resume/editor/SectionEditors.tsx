'use client'

import { Fragment, useId, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { Field, TextArea, inputClass } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import type { ResumeContent } from '@/types/resume'
import { splitLanguage } from '../cvText'
import { strip, wrap } from '../RichText'
import { checkLine } from './bulletChecks'
import { Check } from './Check'
import type { Section } from './sections'

export type EditorProps = {
    content: ResumeContent
    onChange: (c: ResumeContent) => void
    language: string | null
    item: number
    setItem: (i: number) => void
    focusLine?: number
}

// Card is the white editing panel of screen 4.1 with the section title and the "1 SUR 2" counter.
export function Card({ title, counter, children, label }: { title: string; counter?: ReactNode; children: ReactNode; label: string }) {
    return (
        <section aria-label={label} className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 rounded-2xl border border-line-soft bg-white p-5">
            <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 text-xl font-extrabold">{title}</h2>
                {counter}
            </div>
            {children}
        </section>
    )
}

const Lbl = ({ children }: { children: ReactNode }) => (
    <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{children}</span>
)

// Pager moves between the items of a list section and adds or removes one.
function Pager({
    count,
    item,
    setItem,
    onAdd,
    onRemove,
}: {
    count: number
    item: number
    setItem: (i: number) => void
    onAdd: () => void
    onRemove: () => void
}) {
    const t = useTranslations('cv')
    const tc = useTranslations('common')
    return (
        <div className="flex flex-wrap items-center gap-2">
            {count > 1 ? (
                <>
                    <Button variant="secondary" size="sm" disabled={item === 0} onClick={() => setItem(item - 1)}>
                        {t('prev')}
                    </Button>
                    <Button variant="secondary" size="sm" disabled={item >= count - 1} onClick={() => setItem(item + 1)}>
                        {t('next')}
                    </Button>
                </>
            ) : null}
            <Button variant="dashed" size="sm" onClick={onAdd}>
                {t('addItem')}
            </Button>
            {count > 0 ? (
                <Button variant="link" size="sm" className="ms-auto text-ink-3 hover:text-warn-fg" onClick={onRemove}>
                    {t('removeItem')}
                </Button>
            ) : null}
            <span className="sr-only">{count ? tc('of', { current: item + 1, total: count }) : ''}</span>
        </div>
    )
}

function Counter({ item, count }: { item: number; count: number }) {
    const tc = useTranslations('common')
    return count ? <Lbl>{tc('of', { current: item + 1, total: count })}</Lbl> : null
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-3">{children}</div>

// Rule is the green or orange pill under a line.
const Rule = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
    <span
        className={cn(
            'inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold',
            ok ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg',
        )}
    >
        {ok ? '✓' : '!'} {children}
    </span>
)

const FORMATS: { label: string; title: string; open: string; close?: string; cls: string }[] = [
    { label: 'B', title: 'Bold', open: '**', cls: 'font-bold' },
    { label: 'I', title: 'Italic', open: '*', cls: 'italic' },
    { label: 'U', title: 'Underline', open: '__', cls: 'underline' },
]

// FormatBar wraps the selection of a description line in the marks CvPreview and the PDF understand.
function FormatBar({ target, value, onChange }: { target: string; value: string; onChange: (v: string) => void }) {
    const apply = (open: string, close?: string, link?: boolean) => {
        const el = document.getElementById(target) as HTMLTextAreaElement | null
        const s = el?.selectionStart ?? value.length
        const e = el?.selectionEnd ?? value.length
        if (link) {
            const url = window.prompt('https://')
            if (!url || !/^https?:\/\//i.test(url)) return
            const label = value.slice(s, e) || url
            onChange(value.slice(0, s) + `[${label}](${url})` + value.slice(e))
            return
        }
        const r = wrap(value, s, e, open, close)
        onChange(r.text)
        requestAnimationFrame(() => {
            el?.focus()
            el?.setSelectionRange(r.caret, r.caret)
        })
    }
    const btn = 'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-sm text-ink hover:bg-fill-3'
    return (
        <div role="toolbar" aria-label="Format" className="flex gap-1.5">
            {FORMATS.map((f) => (
                <button key={f.label} type="button" title={f.title} aria-label={f.title} className={cn(btn, f.cls)} onClick={() => apply(f.open, f.close)}>
                    {f.label}
                </button>
            ))}
            <button type="button" title="Insert link" aria-label="Insert link" className={btn} onClick={() => apply('', '', true)}>
                🔗
            </button>
        </div>
    )
}
// Lines edits the bullets of an experience or project, with the live checks of the canvas.
export function Lines({
    lines,
    onChange,
    language,
    checks = true,
    focusLine,
    firstLabel,
}: {
    lines: string[]
    onChange: (l: string[]) => void
    language: string | null
    checks?: boolean
    focusLine?: number
    firstLabel?: (n: number) => string
}) {
    const t = useTranslations('cv')
    const id = useId()
    const [active, setActive] = useState(focusLine ?? 0)
    const list = lines.length ? lines : ['']
    const set = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)))
    return (
        <>
            {list.map((line, i) => {
                const c = checkLine(line, language)
                const showTip = checks && i === active && line.trim().length > 0 && !c.number
                return (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor={`${id}-${i}`} className="text-[13.5px] font-medium text-ink-2">
                                {i === 0 ? (firstLabel ?? ((n: number) => t('line1', { n })))(1) : t('lineN', { n: i + 1 })}
                            </label>
                            {i > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => onChange(list.filter((_, j) => j !== i))}
                                    className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] text-ink-3 hover:text-warn-fg"
                                >
                                    {t('removeLine')}
                                </button>
                            ) : null}
                        </div>
                        <FormatBar target={`${id}-${i}`} value={line} onChange={(v) => set(i, v)} />
                        <TextArea
                            id={`${id}-${i}`}
                            rows={3}
                            autoFocus={focusLine === i && i > 0}
                            value={line}
                            onFocus={() => setActive(i)}
                            onChange={(e) => set(i, e.target.value)}
                            className={cn(i === active && 'border-[1.5px] border-ink')}
                        />
                        {checks && line.trim() ? (
                            <div className="flex flex-wrap gap-1.5" aria-live="polite">
                                <Rule ok={c.past && !c.pronoun}>{c.past ? (c.pronoun ? t('checkPronoun') : t('checkPast')) : t('checkPastNo')}</Rule>
                                <Rule ok={c.short}>{c.short ? t('checkShort') : t('checkShortNo')}</Rule>
                                <Rule ok={c.number}>{c.number ? t('checkNumber') : t('checkNumberNo')}</Rule>
                            </div>
                        ) : null}
                        {showTip ? (
                            <p className="m-0 rounded-xl bg-violet-tint px-3.5 py-3 text-[13.5px] leading-[1.55] text-ink-2">
                                <strong className="text-ink">{t('tipNumberTitle')}</strong> {t.rich('tipNumberText', { em: (ch) => <em>{ch}</em> })}
                            </p>
                        ) : null}
                    </div>
                )
            })}
            <Button variant="dashed" className="self-start" onClick={() => onChange([...list, ''])}>
                {t('addLine')}
            </Button>
        </>
    )
}

function replaceAt<T>(xs: T[], i: number, v: T) {
    return xs.map((x, j) => (j === i ? v : x))
}

type Rowish = { hidden?: boolean }

const iconBtn =
    'inline-flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-white text-ink-2 transition-colors hover:bg-fill-3'

// RowsEditor lists the entries of a section as draggable rows with an eye toggle; a click opens one for editing.
function RowsEditor<T extends Rowish>({
    title,
    items,
    item,
    setItem,
    blank,
    onItems,
    render,
    label,
}: {
    title: string
    items: T[]
    item: number
    setItem: (i: number) => void
    blank: T
    onItems: (xs: T[]) => void
    render: (x: T, set: (v: T) => void) => ReactNode
    label: (x: T) => string
}) {
    const t = useTranslations('cv')
    const [drag, setDrag] = useState<number | null>(null)
    const [over, setOver] = useState<number | null>(null)
    const move = (from: number, to: number) => {
        if (from === to) return
        const next = items.slice()
        const [x] = next.splice(from, 1)
        next.splice(to, 0, x)
        onItems(next)
        // The open entry keeps following its own content; a closed list stays closed.
        if (item >= 0) setItem(next.indexOf(items[item]))
    }
    const cur = item >= 0 && item < items.length ? items[item] : undefined
    if (cur) {
        const name = strip(label(cur)).trim() || t('untitled')
        return (
            <Card
                title={t('editEntry')}
                label={t('editLabel', { section: title })}
                counter={
                    <div className="flex gap-2">
                        <button
                            type="button"
                            aria-pressed={!cur.hidden}
                            aria-label={cur.hidden ? t('showEntry', { name }) : t('hideEntry', { name })}
                            title={cur.hidden ? t('showEntry', { name }) : t('hideEntry', { name })}
                            onClick={() => onItems(replaceAt(items, item, { ...cur, hidden: !cur.hidden }))}
                            className={cn(iconBtn, cur.hidden && 'bg-fill-3 text-ink-3')}
                        >
                            <Icon name={cur.hidden ? 'eyeOff' : 'eye'} size={20} />
                        </button>
                        <button
                            type="button"
                            aria-label={t('removeItem')}
                            title={t('removeItem')}
                            onClick={() => {
                                onItems(items.filter((_, j) => j !== item))
                                setItem(-1)
                            }}
                            className={cn(iconBtn, 'hover:border-warn-fg hover:bg-warn-bg hover:text-warn-fg')}
                        >
                            <Icon name="trash" size={20} />
                        </button>
                    </div>
                }
            >
                {render(cur, (v) => onItems(replaceAt(items, item, v)))}
                <div className="sticky bottom-3 flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() => setItem(-1)}
                        className="inline-flex h-12 w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-gradient-to-r from-[#ec0b8a] to-[#ff6a63] text-[15px] font-bold text-white shadow-lg hover:brightness-105"
                    >
                        ✓ {t('done')}
                    </button>
                </div>
            </Card>
        )
    }
    return (
        <Card title={title} label={t('editLabel', { section: title })}>
            {items.length ? <p className="m-0 text-[13px] text-ink-3">{t('rowsHint')}</p> : <p className="m-0 text-sm text-ink-3">{t('empty')}</p>}
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {items.map((x, i) => {
                    const name = strip(label(x)).trim() || t('untitled')
                    return (
                        <li
                            key={i}
                            draggable
                            onDragStart={(e) => {
                                e.stopPropagation()
                                setDrag(i)
                            }}
                            onDragOver={(e) => {
                                e.preventDefault()
                                setOver(i)
                            }}
                            onDragEnd={() => {
                                setDrag(null)
                                setOver(null)
                            }}
                            onDrop={(e) => {
                                e.stopPropagation()
                                if (drag !== null) move(drag, i)
                                setDrag(null)
                                setOver(null)
                            }}
                            className={cn(
                                'rounded-xl border bg-white',
                                over === i && drag !== null && drag !== i ? 'border-ink' : 'border-line-soft',
                                drag === i && 'opacity-50',
                            )}
                        >
                            <div className="flex min-h-14 items-center gap-2.5 px-3 py-2">
                                <span aria-hidden className="cursor-grab select-none text-ink-3">
                                    ⠿
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setItem(i)}
                                    className={cn(
                                        'min-w-0 flex-1 cursor-pointer truncate border-0 bg-transparent p-0 text-start text-sm font-semibold',
                                        x.hidden && 'text-ink-3 line-through',
                                    )}
                                >
                                    {name}
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={!x.hidden}
                                    aria-label={x.hidden ? t('showEntry', { name }) : t('hideEntry', { name })}
                                    title={x.hidden ? t('showEntry', { name }) : t('hideEntry', { name })}
                                    onClick={() => onItems(replaceAt(items, i, { ...x, hidden: !x.hidden }))}
                                    className={cn(iconBtn, x.hidden && 'bg-fill-3 text-ink-3')}
                                >
                                    <Icon name={x.hidden ? 'eyeOff' : 'eye'} size={20} />
                                </button>
                                <button
                                    type="button"
                                    aria-label={t('removeItem')}
                                    title={t('removeItem')}
                                    onClick={() => {
                                        onItems(items.filter((_, j) => j !== i))
                                        setItem(-1)
                                    }}
                                    className={cn(iconBtn, 'hover:border-warn-fg hover:bg-warn-bg hover:text-warn-fg')}
                                >
                                    <Icon name="trash" size={20} />
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
            <Button
                variant="dashed"
                className="h-10 self-start rounded-[10px] font-medium"
                onClick={() => {
                    onItems([...items, blank])
                    setItem(items.length)
                }}
            >
                {t('addEntry')}
            </Button>
        </Card>
    )
}

const UrlField = ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => {
    const t = useTranslations('cv')
    return <Field label={t('fields.url')} type="url" inputMode="url" placeholder="https://…" value={value ?? ''} onChange={(x) => onChange(x.target.value)} />
}
// ListEditor is the shared shape of the list sections: one item at a time, a pager, fields.
function ListEditor<T>({
    title,
    items,
    item,
    setItem,
    blank,
    onItems,
    render,
}: {
    title: string
    items: T[]
    item: number
    setItem: (i: number) => void
    blank: T
    onItems: (xs: T[]) => void
    render: (x: T, set: (v: T) => void) => ReactNode
}) {
    const t = useTranslations('cv')
    const i = Math.max(0, Math.min(item, items.length - 1))
    return (
        <Card title={title} label={t('editLabel', { section: title })} counter={<Counter item={i} count={items.length} />}>
            {items.length ? (
                <Fragment key={i}>{render(items[i], (v) => onItems(replaceAt(items, i, v)))}</Fragment>
            ) : (
                <p className="m-0 text-sm text-ink-3">{t('empty')}</p>
            )}
            <Pager
                count={items.length}
                item={i}
                setItem={setItem}
                onAdd={() => {
                    onItems([...items, blank])
                    setItem(items.length)
                }}
                onRemove={() => {
                    onItems(items.filter((_, j) => j !== i))
                    setItem(Math.max(0, i - 1))
                }}
            />
        </Card>
    )
}

export function ContactEditor({ content, onChange, photo }: EditorProps & { photo: ReactNode }) {
    const t = useTranslations('cv')
    const c = content.contact
    const set = (k: keyof typeof c, v: string | string[]) => onChange({ ...content, contact: { ...c, [k]: v } })
    const title = t('sections.contact')
    return (
        <Card title={title} label={t('editLabel', { section: title })}>
            <Field label={t('fields.name')} value={c.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
            <Field
                label={t('fields.headline')}
                value={c.headline ?? ''}
                placeholder={t('fields.headlineHint')}
                onChange={(e) => set('headline', e.target.value)}
            />
            <Grid>
                <Field label={t('fields.email')} type="email" value={c.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                <Field label={t('fields.phone')} type="tel" value={c.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
            </Grid>
            <Field label={t('fields.location')} value={c.location} onChange={(e) => set('location', e.target.value)} />
            <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                {t('fields.links')}
                <TextArea
                    rows={3}
                    value={c.links.join('\n')}
                    placeholder={t('fields.linksHint')}
                    onChange={(e) => set('links', e.target.value.split('\n'))}
                    onBlur={(e) =>
                        set(
                            'links',
                            e.target.value
                                .split('\n')
                                .map((x) => x.trim())
                                .filter(Boolean),
                        )
                    }
                />
            </label>
            {photo}
        </Card>
    )
}

export function SummaryEditor({ content, onChange }: EditorProps) {
    const t = useTranslations('cv')
    const title = t('sections.summary')
    return (
        <Card title={title} label={t('editLabel', { section: title })}>
            <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                {t('fields.summary')}
                <TextArea rows={6} value={content.summary} onChange={(e) => onChange({ ...content, summary: e.target.value })} />
            </label>
            <p className="m-0 text-[13px] text-ink-3">{t('fields.summaryHint')}</p>
        </Card>
    )
}

export function EducationEditor(p: EditorProps) {
    const t = useTranslations('cv')
    return (
        <RowsEditor
            label={(e) => [e.school, e.degree].filter(Boolean).join(', ')}
            title={t('sections.education')}
            items={p.content.education}
            item={p.item}
            setItem={p.setItem}
            blank={{ degree: '', school: '', location: '', start: '', end: '' }}
            onItems={(education) => p.onChange({ ...p.content, education })}
            render={(e, set) => (
                <>
                    <Grid>
                        <Field label={t('fields.degree')} value={e.degree} onChange={(x) => set({ ...e, degree: x.target.value })} />
                        <Field label={t('fields.school')} value={e.school} onChange={(x) => set({ ...e, school: x.target.value })} />
                        <Field label={t('fields.start')} placeholder="02/2023" value={e.start} onChange={(x) => set({ ...e, start: x.target.value })} />
                        <Field label={t('fields.end')} placeholder="06/2023" value={e.end} onChange={(x) => set({ ...e, end: x.target.value })} />
                    </Grid>
                    <Field label={t('fields.place')} value={e.location ?? ''} onChange={(x) => set({ ...e, location: x.target.value })} />
                    <UrlField value={e.url} onChange={(url) => set({ ...e, url })} />
                </>
            )}
        />
    )
}

export function ExperienceEditor(p: EditorProps) {
    const t = useTranslations('cv')
    return (
        <RowsEditor
            label={(e) => [e.company, e.title].filter(Boolean).join(', ')}
            title={t('sections.experience')}
            items={p.content.experience}
            item={p.item}
            setItem={p.setItem}
            blank={{ title: '', company: '', kind: '', location: '', start: '', end: '', description: [''] }}
            onItems={(experience) => p.onChange({ ...p.content, experience })}
            render={(e, set) => (
                <>
                    <Grid>
                        <Field label={t('fields.title')} value={e.title} onChange={(x) => set({ ...e, title: x.target.value })} />
                        <Field label={t('fields.company')} value={e.company} onChange={(x) => set({ ...e, company: x.target.value })} />
                        <Field label={t('fields.start')} placeholder="02/2023" value={e.start} onChange={(x) => set({ ...e, start: x.target.value })} />
                        <Field label={t('fields.end')} placeholder="06/2023" value={e.end} onChange={(x) => set({ ...e, end: x.target.value })} />
                        <Field
                            label={t('fields.kind')}
                            placeholder={t('fields.kindHint')}
                            value={e.kind ?? ''}
                            onChange={(x) => set({ ...e, kind: x.target.value })}
                        />
                        <Field label={t('fields.place')} value={e.location ?? ''} onChange={(x) => set({ ...e, location: x.target.value })} />
                    </Grid>
                    <UrlField value={e.url} onChange={(url) => set({ ...e, url })} />
                    <Lines lines={e.description} language={p.language} focusLine={p.focusLine} onChange={(description) => set({ ...e, description })} />
                </>
            )}
        />
    )
}

export function ProjectsEditor(p: EditorProps) {
    const t = useTranslations('cv')
    return (
        <RowsEditor
            label={(e) => [e.name].filter(Boolean).join(', ')}
            title={t('sections.projects')}
            items={p.content.projects ?? []}
            item={p.item}
            setItem={p.setItem}
            blank={{ name: '', tech: '', year: '', start: '', end: '', location: '', description: [''] }}
            onItems={(projects) => p.onChange({ ...p.content, projects })}
            render={(e, set) => (
                <>
                    <Field label={t('fields.projectName')} value={e.name} onChange={(x) => set({ ...e, name: x.target.value })} />
                    <Grid>
                        <Field label={t('fields.tech')} value={e.tech} onChange={(x) => set({ ...e, tech: x.target.value })} />
                        <Field
                            label={t('fields.start')}
                            placeholder="02/2023"
                            value={e.start ?? e.year}
                            onChange={(x) => set({ ...e, start: x.target.value })}
                        />
                        <Field label={t('fields.end')} placeholder="06/2023" value={e.end ?? ''} onChange={(x) => set({ ...e, end: x.target.value })} />
                        <Field label={t('fields.place')} value={e.location ?? ''} onChange={(x) => set({ ...e, location: x.target.value })} />
                    </Grid>
                    <UrlField value={e.url} onChange={(url) => set({ ...e, url })} />
                    <Lines lines={e.description} language={p.language} focusLine={p.focusLine} onChange={(description) => set({ ...e, description })} />
                    <Check checked={!e.hide_tech} onChange={(on) => set({ ...e, hide_tech: !on })}>
                        {t('fields.showTech')}
                    </Check>
                </>
            )}
        />
    )
}

const splitItems = (s: string) => s.split(',').map((x) => x.trim())

export function SkillsEditor(p: EditorProps) {
    const t = useTranslations('cv')
    const groups = p.content.skill_groups?.length ? p.content.skill_groups : p.content.skills.length ? [{ label: '', items: p.content.skills }] : []
    const write = (gs: { label: string; items: string[] }[]) => {
        const flat: string[] = []
        for (const g of gs) for (const s of g.items) if (s && !flat.includes(s)) flat.push(s)
        p.onChange({ ...p.content, skill_groups: gs, skills: flat })
    }
    return (
        <ListEditor
            title={t('sections.skills')}
            items={groups}
            item={p.item}
            setItem={p.setItem}
            blank={{ label: '', items: [] }}
            onItems={write}
            render={(g, set) => (
                <>
                    <Field label={t('fields.groupLabel')} value={g.label} onChange={(x) => set({ ...g, label: x.target.value })} />
                    <CommaField label={t('fields.groupItems')} hint={t('fields.groupItemsHint')} items={g.items} onItems={(items) => set({ ...g, items })} />
                </>
            )}
        />
    )
}

// CommaField keeps the typed text while editing and stores the clean list (reset per item by its key).
function CommaField({ label, hint, items, onItems }: { label: string; hint: string; items: string[]; onItems: (xs: string[]) => void }) {
    const [text, setText] = useState(items.join(', '))
    return (
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
            {label}
            <input
                dir="auto"
                className={inputClass}
                value={text}
                placeholder={hint}
                onChange={(e) => {
                    setText(e.target.value)
                    onItems(splitItems(e.target.value).filter(Boolean))
                }}
            />
        </label>
    )
}

export function CertificationsEditor(p: EditorProps) {
    const t = useTranslations('cv')
    return (
        <RowsEditor
            label={(e) => [e.name, e.issuer].filter(Boolean).join(', ')}
            title={t('sections.certifications')}
            items={p.content.certifications}
            item={p.item}
            setItem={p.setItem}
            blank={{ name: '', issuer: '', year: '' }}
            onItems={(certifications) => p.onChange({ ...p.content, certifications })}
            render={(e, set) => (
                <>
                    <Field label={t('fields.certName')} value={e.name} onChange={(x) => set({ ...e, name: x.target.value })} />
                    <UrlField value={e.url} onChange={(url) => set({ ...e, url })} />
                    <Grid>
                        <Field label={t('fields.issuer')} value={e.issuer} onChange={(x) => set({ ...e, issuer: x.target.value })} />
                        <Field label={t('fields.year')} value={e.year} onChange={(x) => set({ ...e, year: x.target.value })} />
                    </Grid>
                </>
            )}
        />
    )
}

export function LanguagesEditor(p: EditorProps) {
    const t = useTranslations('cv')
    const title = t('sections.languages')
    const rows = p.content.languages.map(splitLanguage)
    const write = (rs: [string, string][]) => p.onChange({ ...p.content, languages: rs.map(([n, l]) => (l.trim() ? `${n}: ${l}` : n)) })
    return (
        <Card title={title} label={t('editLabel', { section: title })}>
            {rows.map(([name, level], i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                    <Field label={t('fields.language')} value={name} onChange={(e) => write(replaceAt(rows, i, [e.target.value, level]))} />
                    <Field label={t('fields.level')} value={level} onChange={(e) => write(replaceAt(rows, i, [name, e.target.value]))} />
                    <Button variant="link" size="sm" className="mb-3 text-ink-3 hover:text-warn-fg" onClick={() => write(rows.filter((_, j) => j !== i))}>
                        {t('removeItem')}
                    </Button>
                </div>
            ))}
            <Button variant="dashed" size="sm" className="self-start" onClick={() => write([...rows, ['', '']])}>
                {t('addItem')}
            </Button>
        </Card>
    )
}

export function ExtraEditor({ content, onChange, index, language }: EditorProps & { index: number }) {
    const t = useTranslations('cv')
    const x = content.extra?.[index]
    if (!x) return null
    const set = (v: typeof x) => onChange({ ...content, extra: replaceAt(content.extra ?? [], index, v) })
    return (
        <Card title={x.title || t('fields.extraTitle')} label={t('editLabel', { section: x.title })}>
            <Field label={t('fields.extraTitle')} value={x.title} onChange={(e) => set({ ...x, title: e.target.value })} />
            <Lines
                lines={x.items}
                language={language}
                checks={false}
                firstLabel={(n) => t('fields.extraItem', { n })}
                onChange={(items) => set({ ...x, items })}
            />
            <Button
                variant="link"
                size="sm"
                className="self-start text-ink-3 hover:text-warn-fg"
                onClick={() => onChange({ ...content, extra: (content.extra ?? []).filter((_, j) => j !== index) })}
            >
                {t('removeItem')}
            </Button>
        </Card>
    )
}

export const sectionTitle = (s: Section, content: ResumeContent, t: (k: string) => string) =>
    s.startsWith('extra:') ? (content.extra?.[Number(s.slice(6))]?.title ?? '') : t(`sections.${s}`)
