'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Segmented } from '@/components/ui/Segmented'
import { resolveLook } from '@/lib/cvLook'
import type { AccentTarget, CVStyle, Layout } from '@/types/resume'

const TARGETS: AccentTarget[] = ['name', 'title', 'headings', 'rules', 'dates', 'entry_title', 'links']
const DEFAULT_TARGETS: AccentTarget[] = ['title', 'headings', 'rules', 'entry_title', 'links']
const ACCENT_DEFAULT: Record<Layout, string> = { classic: '#2F5597', modern: '#1F2A44', compact: '#111111' }

type Props = { style: CVStyle | undefined; layout: Layout; onChange: (s: CVStyle | undefined) => void }

const clean = (s: CVStyle): CVStyle | undefined => {
    const out = Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)) as CVStyle
    return Object.keys(out).length ? out : undefined
}

// StylePanel edits content.style. Every control writes one optional field, so an untouched CV keeps its template's look.
export default function StylePanel({ style, layout, onChange }: Props) {
    const t = useTranslations('cv.style')
    const s = style ?? {}
    const look = resolveLook(layout, s)
    const set = (patch: Partial<CVStyle>) => onChange(clean({ ...s, ...patch }))
    const targets = s.accent_on?.length ? s.accent_on : DEFAULT_TARGETS
    const multi = s.color_mode === 'multi'

    return (
        <div className="flex flex-col gap-2 rounded-[14px] border border-line-soft bg-white p-3 text-[13.5px]" data-testid="style-panel">
            <Group title={t('fontSize')} defaultOpen>
                <Range label={t('base')} unit="pt" min={7} max={14} step={0.5} value={look.base} onChange={(v) => set({ base_size: v })} />
                <Range label={t('name')} unit="pt" prefix="+" min={-3} max={20} step={0.5} value={look.name - look.base} onChange={(v) => set({ name_delta: v })} />
                <Range label={t('jobTitle')} unit="pt" prefix="+" min={-3} max={20} step={0.5} value={look.title - look.base} onChange={(v) => set({ title_delta: v })} />
                <Range label={t('headings')} unit="pt" prefix="+" min={-3} max={20} step={0.5} value={look.head - look.base} onChange={(v) => set({ heading_delta: v })} />
                <Range label={t('entry')} unit="pt" prefix="+" min={-3} max={10} step={0.5} value={look.entry - look.base} onChange={(v) => set({ entry_delta: v })} />
            </Group>
            <Group title={t('spacing')}>
                <Range label={t('lineHeight')} min={1} max={2} step={0.05} value={look.lineHeight} onChange={(v) => set({ line_height: v })} />
                <Range label={t('gap')} unit="mm" min={0} max={10} step={0.5} value={look.gap ?? 1} onChange={(v) => set({ gap: v })} />
                <Range label={t('marginX')} unit="mm" min={5} max={30} step={1} value={look.mx} onChange={(v) => set({ margin_x: v })} />
                <Range label={t('marginY')} unit="mm" min={5} max={30} step={1} value={look.my} onChange={(v) => set({ margin_y: v })} />
            </Group>
            <Group title={t('entryLayout')}>
                <Field label={t('datePosition')}>
                    <Segmented
                        role="radiogroup"
                        label={t('datePosition')}
                        value={s.date_position ?? 'right'}
                        onChange={(v) => set({ date_position: v })}
                        options={[
                            { value: 'right', label: t('right') },
                            { value: 'below', label: t('below') },
                        ]}
                    />
                </Field>
            </Group>
            <Group title={t('headingsGroup')}>
                <Field label={t('capitalization')}>
                    <Segmented
                        role="radiogroup"
                        label={t('capitalization')}
                        value={look.upper ? 'uppercase' : 'capitalize'}
                        onChange={(v) => set({ heading_case: v })}
                        options={[
                            { value: 'capitalize', label: t('capitalize') },
                            { value: 'uppercase', label: t('uppercase') },
                        ]}
                    />
                </Field>
                <Field label={t('nameFont')}>
                    <Segmented
                        role="radiogroup"
                        label={t('nameFont')}
                        value={look.nameSerif ? 'serif' : 'sans'}
                        onChange={(v) => set({ name_font: v })}
                        options={[
                            { value: 'sans', label: t('sans') },
                            { value: 'serif', label: t('serif') },
                        ]}
                    />
                </Field>
            </Group>
            <Group title={t('colors')}>
                <Field label={t('colorMode')}>
                    <Segmented
                        role="radiogroup"
                        label={t('colorMode')}
                        value={multi ? 'multi' : 'single'}
                        onChange={(v) => set({ color_mode: v })}
                        options={[
                            { value: 'single', label: t('single') },
                            { value: 'multi', label: t('multi') },
                        ]}
                    />
                </Field>
                <p className="m-0 text-[12.5px] text-ink-3">{multi ? t('multiHint') : t('singleHint')}</p>
                <ColorField label={t('accent')} value={s.accent ?? ACCENT_DEFAULT[layout]} onChange={(v) => set({ accent: v })} />
                {multi ? (
                    <>
                        <ColorField label={t('textColor')} value={s.text ?? '#1A1A1A'} onChange={(v) => set({ text: v })} />
                        <ColorField label={t('background')} value={s.background ?? '#FFFFFF'} onChange={(v) => set({ background: v })} />
                    </>
                ) : null}
                <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
                    <legend className="mb-1 p-0 font-medium">{t('applyAccent')}</legend>
                    {TARGETS.map((k) => (
                        <label key={k} className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={targets.includes(k)}
                                onChange={(e) => set({ accent_on: TARGETS.filter((x) => (x === k ? e.target.checked : targets.includes(x))) })}
                            />
                            {t(`target.${k}`)}
                        </label>
                    ))}
                </fieldset>
            </Group>
            <Group title={t('header')}>
                <Field label={t('align')}>
                    <Segmented
                        role="radiogroup"
                        label={t('align')}
                        value={look.center ? 'center' : 'left'}
                        onChange={(v) => set({ align: v })}
                        options={[
                            { value: 'left', label: t('left') },
                            { value: 'center', label: t('center') },
                        ]}
                    />
                </Field>
                <Field label={t('separator')}>
                    <Segmented
                        role="radiogroup"
                        label={t('separator')}
                        value={s.separator ?? 'bullet'}
                        onChange={(v) => set({ separator: v })}
                        options={[
                            { value: 'bullet', label: '•' },
                            { value: 'bar', label: '|' },
                        ]}
                    />
                </Field>
                {layout !== 'compact' ? (
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={look.showPhoto} onChange={(e) => set({ show_photo: e.target.checked ? undefined : false })} />
                        {t('showPhoto')}
                    </label>
                ) : null}
            </Group>
            <button
                type="button"
                onClick={() => onChange(undefined)}
                disabled={!style}
                className="h-9 cursor-pointer self-start rounded-[10px] border border-line-strong bg-white px-3 text-[13px] font-medium text-ink-2 enabled:hover:bg-fill-3 disabled:cursor-default disabled:opacity-50"
            >
                {t('reset')}
            </button>
        </div>
    )
}

function Group({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(!!defaultOpen)
    return (
        <section className="flex flex-col gap-2 border-b border-line-soft pb-2 last:border-b-0">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="flex h-8 cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-start text-[14px] font-semibold text-ink"
            >
                {title}
                <span aria-hidden className="text-ink-3">
                    {open ? '−' : '+'}
                </span>
            </button>
            {open ? <div className="flex flex-col gap-2.5">{children}</div> : null}
        </section>
    )
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        {children}
    </div>
)

const fmt = (n: number) => String(Math.round(n * 100) / 100)

function Range({ label, value, min, max, step, unit = '', prefix = '', onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; prefix?: string; onChange: (v: number) => void }) {
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
        <label className="flex items-center justify-between gap-3">
            <span className="font-medium">{label}</span>
            <span className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-ink-3">{value.toUpperCase()}</span>
                <input type="color" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-line-strong bg-white p-0.5" />
            </span>
        </label>
    )
}
