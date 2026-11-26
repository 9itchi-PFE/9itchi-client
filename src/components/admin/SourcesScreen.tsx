'use client'

import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Field, TextArea, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Select } from '@/components/ui/Select'
import { useDeleteSource, useRunSource, useSaveSource, useSources } from '@/hooks/useAdminJobs'
import { cn } from '@/lib/cn'
import { BOARD_KINDS, type Source, type SourceKind } from '@/types/job'
import { boardKind, cap, health, KIND_NAMES, places, sourceLook, when, type SourceLook, type When } from './collect'

const EVERY = [6, 12, 24, 168]

const pill: Record<SourceLook, string> = {
    ok: 'bg-ok-bg text-ok-fg',
    running: 'bg-violet-soft text-violet-hover',
    idle: 'bg-fill text-ink-3',
    off: 'bg-fill text-ink-3',
    error: 'bg-[#FEF3F2] text-[#B42318]',
}

// WhenText says when something happened, as the canvas does (« Il y a 2 h », « Hier, 03:00 »).
export function WhenText({ value }: { value: When }) {
    const t = useTranslations('admin')
    const format = useFormatter()
    switch (value.kind) {
        case 'never':
            return <>{t('never')}</>
        case 'minutes':
            return <>{t('minutesAgo', { count: value.count })}</>
        case 'hours':
            return <>{t('hoursAgo', { count: value.count })}</>
        case 'yesterday':
            return <>{t('yesterday', { time: value.time })}</>
        default:
            return <>{format.dateTime(value.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
    }
}

export const apiError = (e: unknown) => (isAxiosError(e) ? (e.response?.data as { error?: string } | undefined)?.error : undefined)

// Kpi is one figure of an admin page with what it counts above and a remark below (also used by the statistics).
export function Kpi({ label, value, sub }: { label: string; value?: number | string; sub: string }) {
    return (
        <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white px-[18px] py-[18px]">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-ink-3">{label}</span>
            <span className="font-display text-[30px] font-extrabold leading-none">{value ?? '–'}</span>
            <span className="text-[13.5px] text-ink-3">{sub}</span>
        </div>
    )
}

function SourceModal({ source, onClose }: { source: Source | null | undefined; onClose: () => void }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const save = useSaveSource()
    const remove = useDeleteSource()
    const [error, setError] = useState('')
    const editing = !!source
    const open = source !== undefined
    if (!open) return null

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const kind = String(f.get('kind') ?? '')
        setError('')
        save.mutate(
            {
                id: source?.id,
                input: {
                    company: String(f.get('company')).trim(),
                    careers_url: String(f.get('careers_url')).trim(),
                    places: places(String(f.get('places'))),
                    every_hours: Number(f.get('every_hours')),
                    enabled: f.get('enabled') === 'on',
                    note: String(f.get('note')).trim(),
                    // PATCH replaces the source: the cap is always sent back.
                    monthly_cap: cap(String(f.get('monthly_cap') ?? '')),
                    ...(kind ? { kind: kind as SourceKind } : {}),
                },
            },
            {
                onSuccess: () => {
                    toast(t('saved'))
                    onClose()
                },
                onError: (err) => setError(isAxiosError(err) && err.response?.status === 409 ? t('duplicateSource') : (apiError(err) ?? t('stateError'))),
            },
        )
    }
    const del = () => {
        if (!source || !window.confirm(t('deleteConfirm', { company: source.company }))) return
        remove.mutate(source.id, {
            onSuccess: () => {
                toast(t('deleted'))
                onClose()
            },
        })
    }
    return (
        <Modal open onClose={onClose} title={editing ? t('sourceEdit') : t('sourceAdd')} width={560}>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <Field name="company" label={t('fCompany')} required maxLength={200} defaultValue={source?.company} />
                <div className="flex flex-col gap-1.5">
                    <Field name="careers_url" type="url" label={t('fUrl')} required maxLength={2000} dir="ltr" defaultValue={source?.careers_url} />
                    <span className="text-[12.5px] leading-[1.45] text-ink-3">{t('fUrlHint')}</span>
                </div>
                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                        {t('fKind')}
                        <Select name="kind" defaultValue={boardKind(source?.kind)} className={inputClass}>
                            <option value="">{t('kindAuto')}</option>
                            {BOARD_KINDS.map((k) => (
                                <option key={k} value={k}>
                                    {KIND_NAMES[k]}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <div className="flex flex-col gap-1.5">
                        <Field
                            name="monthly_cap"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            label={t('fCap')}
                            defaultValue={source?.monthly_cap ?? 0}
                        />
                        <span className="text-[12.5px] leading-[1.45] text-ink-3">{t('fCapHint')}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Field name="places" label={t('fPlaces')} defaultValue={source?.places.join(', ')} />
                    <span className="text-[12.5px] text-ink-3">{t('fPlacesHint')}</span>
                </div>
                <div className="grid grid-cols-2 items-end gap-3">
                    <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                        {t('fEvery')}
                        <Select name="every_hours" defaultValue={source?.every_hours ?? 24} className={inputClass}>
                            {[...new Set([...EVERY, source?.every_hours ?? 24])].map((h) => (
                                <option key={h} value={h}>
                                    {t('every', { hours: h })}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label className="flex h-11 items-center gap-2 text-sm font-medium text-ink-2">
                        <input type="checkbox" name="enabled" defaultChecked={source?.enabled ?? true} className="h-4 w-4 accent-ink" />
                        {t('fEnabled')}
                    </label>
                </div>
                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                    {t('fNote')}
                    <TextArea name="note" rows={2} maxLength={500} defaultValue={source?.note} />
                </label>
                {error ? (
                    <p role="alert" className="m-0 text-sm text-[#B42318]">
                        {error}
                    </p>
                ) : null}
                <div className="flex items-center justify-between gap-3 pt-1">
                    {editing ? (
                        <Button variant="link" className="text-[#B42318] hover:text-[#912018]" onClick={del} disabled={remove.isPending}>
                            {t('delete')}
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button type="submit" disabled={save.isPending}>
                        {t('save')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// SourcesScreen is « Collectes d'offres »: the KPIs of the last 24 hours and the careers pages job-api reads.
export default function SourcesScreen() {
    const t = useTranslations('admin')
    const format = useFormatter()
    const toast = useToast()
    const { data, isLoading } = useSources()
    const run = useRunSource()
    // undefined: closed; null: a new source; a source: editing it.
    const [editing, setEditing] = useState<Source | null | undefined>(undefined)
    const s = data?.stats
    const now = new Date()
    const cols = 'grid grid-cols-[1.3fr_1fr_1fr_1fr_1.3fr_90px] items-center gap-3 px-4'
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('sourcesTitle')}</h1>
                <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('sourcesSubtitle')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                <Kpi label={t('kpiOnline')} value={s?.online} sub={t('kpiOnlineSub', { count: s?.online_from_book ?? 0 })} />
                <Kpi label={t('kpiNew')} value={s?.new_24h} sub={t('kpiNewSub')} />
                <Kpi label={t('kpiDup')} value={s?.duplicates_24h} sub={t('kpiDupSub')} />
                <Kpi label={t('kpiExpired')} value={s?.expired_24h} sub={t('kpiExpiredSub')} />
            </div>
            <section aria-labelledby="sources-h" className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                    <h2 id="sources-h" className="m-0 text-xl font-extrabold">
                        {t('sources')}
                    </h2>
                    <Button variant="secondary" onClick={() => setEditing(null)}>
                        {t('addSource')}
                    </Button>
                </div>
                <div role="table" aria-labelledby="sources-h" className="overflow-x-auto">
                    <div role="row" className={cn(cols, 'min-w-[860px] rounded-[10px] bg-fill-3 py-2.5 text-[13px] font-semibold text-ink-3')}>
                        <span role="columnheader">{t('colSource')}</span>
                        <span role="columnheader">{t('colEvery')}</span>
                        <span role="columnheader">{t('colLast')}</span>
                        <span role="columnheader">{t('colFound')}</span>
                        <span role="columnheader">{t('colState')}</span>
                        <span role="columnheader" className="sr-only">
                            {t('run')}
                        </span>
                    </div>
                    {isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                    {data && data.items.length === 0 ? <p className="m-0 px-4 py-6 text-sm text-ink-3">{t('noSources')}</p> : null}
                    {data?.items.map((src) => {
                        const look = sourceLook(src)
                        const h = health(src, now)
                        return (
                            <div role="row" key={src.id} className={cn(cols, 'min-w-[860px] border-b border-line-soft py-3.5 text-[14.5px]')}>
                                <span role="cell" className="min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(src)}
                                        className="block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-start font-bold text-ink hover:text-violet"
                                        title={src.careers_url}
                                    >
                                        {src.company}
                                    </button>
                                    {src.places.length ? <span className="block truncate text-xs text-ink-3">{src.places.join(', ')}</span> : null}
                                </span>
                                <span role="cell">{t('every', { hours: src.every_hours })}</span>
                                <span role="cell">
                                    <WhenText value={when(src.last_run_at, now)} />
                                </span>
                                <span role="cell" className="tabular-nums">
                                    {src.last_run_at ? `${src.last_found} / ${src.last_new}` : '–'}
                                </span>
                                <span role="cell" className="min-w-0">
                                    <span
                                        className={cn('inline-block max-w-full truncate rounded-full px-2.5 py-[3px] text-[13px] font-semibold', pill[look])}
                                        title={look === 'error' ? src.last_error : undefined}
                                    >
                                        {look === 'error'
                                            ? src.last_error || t('stateError')
                                            : t(({ ok: 'stateOk', running: 'stateRunning', idle: 'stateIdle', off: 'stateOff' } as const)[look])}
                                    </span>
                                    {h.blockedUntil ? (
                                        <span className="block truncate text-xs text-warn-fg">
                                            {t('blockedUntil', {
                                                date: format.dateTime(h.blockedUntil, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                                            })}
                                        </span>
                                    ) : null}
                                    {h.fails > 0 || h.calls ? (
                                        <span className="block truncate text-xs tabular-nums text-ink-3">
                                            {[
                                                h.fails > 0 ? t('fails', { count: h.fails }) : '',
                                                h.calls
                                                    ? h.calls.cap > 0
                                                        ? t('calls', { used: h.calls.used, cap: h.calls.cap })
                                                        : t('callsNoCap', { used: h.calls.used })
                                                    : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    ) : null}
                                </span>
                                <span role="cell" className="flex justify-end">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={look === 'running' || (run.isPending && run.variables === src.id)}
                                        onClick={() =>
                                            run.mutate(src.id, {
                                                onSuccess: () => toast(t('runStarted', { company: src.company })),
                                                onError: (e) =>
                                                    toast(isAxiosError(e) && e.response?.status === 409 ? t('runBusy') : (apiError(e) ?? t('stateError'))),
                                            })
                                        }
                                    >
                                        {t('run')}
                                    </Button>
                                </span>
                            </div>
                        )
                    })}
                </div>
            </section>
            <SourceModal key={editing === undefined ? 'closed' : (editing?.id ?? 'new')} source={editing} onClose={() => setEditing(undefined)} />
        </div>
    )
}
