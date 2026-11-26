'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Segmented } from '@/components/ui/Segmented'
import { Button } from '@/components/ui/Button'
import { Check } from './Check'
import { BODY_FONTS, entryArrangement, entryDefault, resolveLook } from '@/lib/cvLook'
import type { AccentTarget, BodyFont, CVStyle, Layout, TextStyle as TextStyleT } from '@/types/resume'
import ShowSwitch from './ShowSwitch'

const TARGETS: AccentTarget[] = ['name', 'title', 'headings', 'rules', 'dates', 'location', 'entry_title', 'subtitle', 'links']
const DEFAULT_TARGETS: AccentTarget[] = ['title', 'headings', 'rules', 'entry_title', 'subtitle', 'links']
const ACCENT_DEFAULT: Record<Layout, string> = { classic: '#2F5597', modern: '#1F2A44', compact: '#111111' }

type Props = { style: CVStyle | undefined; layout: Layout; onChange: (s: CVStyle | undefined) => void }

const clean = (s: CVStyle): CVStyle | undefined => {
    const out = Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)) as CVStyle
    return Object.keys(out).length ? out : undefined
}

type Cat = 'typography' | 'spacing' | 'entries' | 'colors' | 'header'
const CATS: Cat[] = ['typography', 'spacing', 'entries', 'colors', 'header']

// StylePanel edits content.style. Every control writes one optional field, so an untouched CV keeps its template's look.
// Controls that belong together sit in one titled block; short pairs of choices share a row.
export default function StylePanel({ style, layout, onChange }: Props) {
    const t = useTranslations('cv.style')
    const [cat, setCat] = useState<Cat>('typography')
    const s = style ?? {}
    const look = resolveLook(layout, s)
    const set = (patch: Partial<CVStyle>) => onChange(clean({ ...s, ...patch }))
    const targets = s.accent_on ?? DEFAULT_TARGETS
    const multi = s.color_mode === 'multi'
    const entry = entryArrangement(layout, 'experience', s) ?? entryDefault(layout, 'experience')

    return (
        <div className="flex flex-col gap-4 text-[13.5px]" data-testid="style-panel">
            <div role="tablist" aria-label={t('categories')} className="flex gap-0.5 rounded-xl bg-[#EFF0F2] p-[3px]">
                {CATS.map((k) => (
                    <button
                        key={k}
                        type="button"
                        role="tab"
                        aria-selected={cat === k}
                        onClick={() => setCat(k)}
                        className={`h-9 flex-auto cursor-pointer whitespace-nowrap rounded-[9px] border-0 px-2 text-[13px] font-semibold ${cat === k ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,.1)]' : 'bg-transparent text-ink-3 hover:text-ink'}`}
                    >
                        {t(`cat.${k}`)}
                    </button>
                ))}
            </div>
            <Group id="typography" cat={cat}>
                <Block title={t('block.font')}>
                    <FontPicker value={look.bodyFont} onChange={(v) => set({ body_font: v === 'sourcesans' ? undefined : v })} />
                </Block>
                <Block title={t('block.sizes')}>
                    <Range label={t('base')} unit="pt" min={7} max={14} step={0.5} value={look.base} onChange={(v) => set({ base_size: v })} />
                    <Range
                        label={t('name')}
                        unit="pt"
                        prefix="+"
                        min={-3}
                        max={20}
                        step={0.5}
                        value={look.name - look.base}
                        onChange={(v) => set({ name_delta: v })}
                    />
                    <Range
                        label={t('jobTitle')}
                        unit="pt"
                        prefix="+"
                        min={-3}
                        max={20}
                        step={0.5}
                        value={look.title - look.base}
                        onChange={(v) => set({ title_delta: v })}
                    />
                    <Range
                        label={t('headings')}
                        unit="pt"
                        prefix="+"
                        min={-3}
                        max={20}
                        step={0.5}
                        value={look.head - look.base}
                        onChange={(v) => set({ heading_delta: v })}
                    />
                    <Range
                        label={t('entry')}
                        unit="pt"
                        prefix="+"
                        min={-3}
                        max={10}
                        step={0.5}
                        value={look.entry - look.base}
                        onChange={(v) => set({ entry_delta: v })}
                    />
                </Block>
                <Block title={t('block.headingsName')}>
                    <Pick
                        label={t('capitalization')}
                        value={look.upper ? 'uppercase' : 'capitalize'}
                        onChange={(v) => set({ heading_case: v })}
                        options={[
                            { value: 'capitalize', label: t('capitalize') },
                            { value: 'uppercase', label: t('uppercase') },
                        ]}
                    />
                    <Pick
                        label={t('nameFont')}
                        value={look.nameSerif ? 'serif' : 'sans'}
                        onChange={(v) => set({ name_font: v })}
                        options={[
                            { value: 'sans', label: t('sans') },
                            { value: 'serif', label: t('serif') },
                        ]}
                    />
                    <Check checked={look.headBold} onChange={(on) => set({ heading_bold: on })}>
                        {t('headingBold')}
                    </Check>
                </Block>
            </Group>
            <Group id="spacing" cat={cat}>
                <Block title={t('block.spacing')}>
                    <Range label={t('lineHeight')} min={1} max={2} step={0.05} value={look.lineHeight} onChange={(v) => set({ line_height: v })} />
                    <Range label={t('gap')} unit="mm" min={0} max={10} step={0.5} value={look.gap ?? 1} onChange={(v) => set({ gap: v })} />
                </Block>
                <Block title={t('block.margins')}>
                    <Range label={t('marginX')} unit="mm" min={5} max={30} step={1} value={look.mx} onChange={(v) => set({ margin_x: v })} />
                    <Range label={t('marginY')} unit="mm" min={5} max={30} step={1} value={look.my} onChange={(v) => set({ margin_y: v })} />
                </Block>
                <Block title={t('block.lists')}>
                    <Pick
                        label={t('listStyle')}
                        value={s.list_style ?? 'bullet'}
                        onChange={(v) => set({ list_style: v })}
                        options={[
                            { value: 'bullet', label: t('bullet') },
                            { value: 'hyphen', label: t('hyphen') },
                        ]}
                    />
                    <Check checked={look.indent} onChange={(on) => set({ indent_body: on ? undefined : false })}>
                        {t('indentBody')}
                    </Check>
                </Block>
            </Group>
            <Group id="entries" cat={cat}>
                <Block title={t('block.titleCompany')}>
                    <Pick
                        label={t('entryLayout')}
                        value={entry.inline ? 'inline' : 'stacked'}
                        onChange={(v) => set({ entry_layout: v })}
                        options={[
                            { value: 'inline', label: t('sideBySide') },
                            { value: 'stacked', label: t('stacked') },
                        ]}
                    />
                    <Pick
                        label={t('entryOrder')}
                        value={entry.subtitleFirst ? 'subtitle_first' : 'title_first'}
                        onChange={(v) => set({ entry_order: v })}
                        options={[
                            { value: 'title_first', label: t('titleFirst') },
                            { value: 'subtitle_first', label: t('companyFirst') },
                        ]}
                    />
                    <p className="m-0 text-[12.5px] text-ink-3">{t('entryHint')}</p>
                </Block>
                <Block title={t('block.datesLocation')}>
                    <Pick
                        label={t('datePosition')}
                        value={s.date_position ?? 'right'}
                        onChange={(v) => set({ date_position: v })}
                        options={[
                            { value: 'right', label: t('right') },
                            { value: 'below', label: t('below') },
                        ]}
                    />
                    <Pick
                        label={t('locationPosition')}
                        value={s.location_position ?? 'line'}
                        onChange={(v) => set({ location_position: v })}
                        options={[
                            { value: 'line', label: t('ownLine') },
                            { value: 'date', label: t('besideDate') },
                        ]}
                    />
                    <Pick
                        label={t('metaOrder')}
                        value={s.meta_order ?? 'date_first'}
                        onChange={(v) => set({ meta_order: v })}
                        options={[
                            { value: 'date_first', label: t('dateLocation') },
                            { value: 'location_first', label: t('locationDate') },
                        ]}
                    />
                    <Pick
                        label={t('metaSeparator')}
                        value={s.meta_separator ?? 'bullet'}
                        onChange={(v) => set({ meta_separator: v })}
                        options={[
                            { value: 'bullet', label: '•' },
                            { value: 'hyphen', label: '-' },
                            { value: 'bar', label: '|' },
                        ]}
                    />
                </Block>
                <Block title={t('block.entryText')}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('subtitleStyle')}>
                            <TextStyle label={t('subtitleStyle')} value={s.subtitle_style} onChange={(v) => set({ subtitle_style: v })} />
                        </Field>
                        <Field label={t('dateStyle')}>
                            <TextStyle label={t('dateStyle')} value={s.date_style} onChange={(v) => set({ date_style: v })} />
                        </Field>
                    </div>
                </Block>
            </Group>
            <Group id="colors" cat={cat}>
                <Block title={t('block.colorMode')}>
                    <Pick
                        label={t('colorMode')}
                        value={multi ? 'multi' : 'single'}
                        onChange={(v) => set({ color_mode: v })}
                        options={[
                            { value: 'single', label: t('single') },
                            { value: 'multi', label: t('multi') },
                        ]}
                    />
                    <p className="m-0 text-[12.5px] text-ink-3">{multi ? t('multiHint') : t('singleHint')}</p>
                </Block>
                <Block title={t('block.colors')}>
                    <ColorField label={t('accent')} value={s.accent ?? ACCENT_DEFAULT[layout]} onChange={(v) => set({ accent: v })} />
                    {multi ? (
                        <>
                            <ColorField label={t('textColor')} value={s.text ?? '#1A1A1A'} onChange={(v) => set({ text: v })} />
                            <ColorField label={t('background')} value={s.background ?? '#FFFFFF'} onChange={(v) => set({ background: v })} />
                        </>
                    ) : null}
                </Block>
                <Block title={t('applyAccent')}>
                    <fieldset className="m-0 grid grid-cols-2 gap-x-3 gap-y-2.5 border-0 p-0">
                        <legend className="sr-only">{t('applyAccent')}</legend>
                        {TARGETS.filter((k) => k !== 'subtitle' || layout === 'classic').map((k) => (
                            <Check
                                key={k}
                                checked={targets.includes(k)}
                                onChange={(on) => set({ accent_on: TARGETS.filter((x) => (x === k ? on : targets.includes(x))) })}
                            >
                                {t(`target.${k}`)}
                            </Check>
                        ))}
                    </fieldset>
                </Block>
            </Group>
            <Group id="header" cat={cat}>
                <Block title={t('block.nameTitle')}>
                    <Pick
                        label={t('align')}
                        value={look.center ? 'center' : 'left'}
                        onChange={(v) => set({ align: v })}
                        options={[
                            { value: 'left', label: t('left') },
                            { value: 'center', label: t('center') },
                        ]}
                    />
                    <Pick
                        label={t('headerLayout')}
                        value={s.header_layout ?? 'inline'}
                        onChange={(v) => set({ header_layout: v })}
                        options={[
                            { value: 'inline', label: t('titleBesideName') },
                            { value: 'stacked', label: t('titleBelowName') },
                        ]}
                    />
                    <Pick
                        label={t('headerValign')}
                        value={look.valign}
                        onChange={(v) => set({ header_valign: v })}
                        options={[
                            { value: 'top', label: t('alignTop') },
                            { value: 'middle', label: t('alignMiddle') },
                            { value: 'bottom', label: t('alignBottom') },
                        ]}
                    />
                </Block>
                <Block title={t('block.contact')}>
                    <Pick
                        label={t('separator')}
                        value={s.separator ?? (look.icons ? 'icon' : 'bullet')}
                        onChange={(v) => set({ separator: v })}
                        options={[
                            { value: 'bullet', label: '•' },
                            { value: 'bar', label: '|' },
                            { value: 'icon', label: t('icons') },
                        ]}
                    />
                </Block>
                <Block title={t('photo')}>
                    <div className="flex flex-wrap items-center gap-3">
                        <ShowSwitch shown={look.showPhoto} label={t('showPhoto')} onChange={(on) => set({ show_photo: on ? undefined : false })} />
                        {layout === 'modern' ? null : (
                            <Segmented
                                role="radiogroup"
                                label={t('photoPosition')}
                                value={s.photo_position ?? 'left'}
                                onChange={(v) => set({ photo_position: v })}
                                options={[
                                    { value: 'left', label: t('photoLeft') },
                                    { value: 'right', label: t('photoRight') },
                                ]}
                            />
                        )}
                    </div>
                </Block>
            </Group>
            <Button variant="secondary" size="sm" className="self-start" onClick={() => onChange(undefined)} disabled={!style}>
                {t('reset')}
            </Button>
        </div>
    )
}

function Group({ id, cat, children }: { id: Cat; cat: Cat; children: ReactNode }) {
    if (id !== cat) return null
    return <div className="flex flex-col gap-4">{children}</div>
}

// Block is a titled set of controls that belong together; blocks are told apart by a hairline, as the other settings screens do.
function Block({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-3 border-t border-line-soft pt-4 first:border-t-0 first:pt-0">
            <h4 className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{title}</h4>
            {children}
        </section>
    )
}

function FontPicker({ value, onChange }: { value: BodyFont; onChange: (v: BodyFont) => void }) {
    return (
        <div role="radiogroup" aria-label="Font" className="grid max-h-[280px] grid-cols-2 gap-2 overflow-y-auto pe-1">
            {(Object.keys(BODY_FONTS) as BodyFont[]).map((k) => (
                <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={value === k}
                    onClick={() => onChange(k)}
                    style={{ fontFamily: BODY_FONTS[k].stack || '"Source Sans 3 Variable",sans-serif' }}
                    className={`h-10 cursor-pointer rounded-[10px] border px-2 text-[14px] ${value === k ? 'border-violet bg-violet-tint font-semibold text-ink' : 'border-line-strong bg-white text-ink-2 hover:bg-fill-3'}`}
                >
                    {BODY_FONTS[k].label}
                </button>
            ))}
        </div>
    )
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1.5">
        <span className="font-medium text-ink-2">{label}</span>
        {children}
    </div>
)

// Pick is a labelled choice whose options fill their column, so related choices line up one under the other or side by side.
function Pick<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: T
    options: { value: T; label: string }[]
    onChange: (v: T) => void
}) {
    return (
        <Field label={label}>
            <Segmented
                role="radiogroup"
                label={label}
                value={value}
                onChange={onChange}
                options={options}
                className="w-full"
                itemClassName="min-w-0 flex-1 truncate px-2"
            />
        </Field>
    )
}

const fmt = (n: number) => String(Math.round(n * 100) / 100)

function Range({
    label,
    value,
    min,
    max,
    step,
    unit = '',
    prefix = '',
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    step: number
    unit?: string
    prefix?: string
    onChange: (v: number) => void
}) {
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="w-[42%] font-medium">{label}</span>
            <input
                type="range"
                aria-label={label}
                className="min-w-0 flex-1 accent-violet"
                min={min}
                max={max}
                step={step}
                value={Math.min(max, Math.max(min, value))}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            <output className="w-[54px] text-end tabular-nums text-ink-3">
                {value > 0 ? prefix : ''}
                {fmt(value)}
                {unit}
            </output>
        </label>
    )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center justify-between gap-3">
                <span className="font-medium">{label}</span>
                <span className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-ink-3">{value.toUpperCase()}</span>
                    <input
                        type="color"
                        aria-label={label}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-line-strong bg-white p-0.5"
                    />
                </span>
            </label>
            <div className="grid grid-cols-8 gap-2">
                {SWATCHES.map((c) => (
                    <button
                        key={c}
                        type="button"
                        aria-label={c}
                        onClick={() => onChange(c)}
                        style={{ background: c }}
                        className={`h-7 w-7 cursor-pointer rounded-full border-2 ${value.toLowerCase() === c.toLowerCase() ? 'border-ink' : 'border-white shadow-[0_0_0_1px_#d0d0d0]'}`}
                    />
                ))}
            </div>
        </div>
    )
}

// the FlowCV palette, plus black and the template blues
const SWATCHES = [
    '#111111',
    '#485A66',
    '#527A7E',
    '#93B5BF',
    '#3589A9',
    '#355C7D',
    '#3A72A8',
    '#689AC4',
    '#5BA6D9',
    '#84D2F6',
    '#46226F',
    '#6A2B50',
    '#C16A82',
    '#C94179',
    '#F55C6A',
    '#2F5597',
]

const TextStyle = ({ label, value, onChange }: { label: string; value?: TextStyleT; onChange: (v: TextStyleT | undefined) => void }) => (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1.5">
        {(['normal', 'bold', 'italic'] as const).map((k) => (
            <button
                key={k}
                type="button"
                role="radio"
                aria-checked={value === k}
                aria-label={k}
                onClick={() => onChange(value === k ? undefined : k)}
                className={`h-9 cursor-pointer rounded-lg border text-sm ${value === k ? 'border-ink bg-ink text-white' : 'border-line-soft bg-white text-ink'}`}
                style={{ fontWeight: k === 'bold' ? 700 : 400, fontStyle: k === 'italic' ? 'italic' : 'normal' }}
            >
                Aa
            </button>
        ))}
    </div>
)
