'use client'

import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { TOPICS, type Topic, type WorkMode } from '@/types/preferences'
import type { Filters } from './filters'

const LENGTHS = [3, 4, 5, 6]
const MODES: WorkMode[] = ['on_site', 'hybrid', 'remote']

// nextMonths lists the start months a student can pick: this month and the next eleven, as YYYY-MM.
export function nextMonths(now = new Date()): string[] {
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
}

function Choice<T extends string | number>({
    legend,
    value,
    options,
    onChange,
}: {
    legend: string
    value: T | undefined
    options: { value: T; label: string }[]
    onChange: (v: T | undefined) => void
}) {
    const t = useTranslations('offers')
    const all = [{ value: undefined, label: t('any') } as { value: T | undefined; label: string }, ...options]
    return (
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 font-display text-[17px] font-extrabold tracking-tightish">{legend}</legend>
            <div className="flex flex-wrap gap-2">
                {all.map((o) => (
                    <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)} className="qf">
                        {o.label}
                    </button>
                ))}
            </div>
        </fieldset>
    )
}

// MoreFilters is the « Plus de filtres » drawer: field, length, start month, work mode and city.
export default function MoreFilters({
    open,
    filters,
    onClose,
    onApply,
}: {
    open: boolean
    filters: Filters
    onClose: () => void
    onApply: (f: Filters) => void
}) {
    const t = useTranslations('offers')
    const tt = useTranslations('prefs.topics')
    const tm = useTranslations('prefs.modes')
    const format = useFormatter()
    const [draft, setDraft] = useState(filters)
    const [shownFor, setShownFor] = useState(open)
    if (open !== shownFor) {
        // Each opening starts from the filters on screen.
        setShownFor(open)
        if (open) setDraft(filters)
    }
    const set = (p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p }))
    return (
        <Drawer open={open} onClose={onClose} title={t('moreTitle')}>
            <Choice<Topic>
                legend={t('moreTopic')}
                value={draft.topic}
                options={TOPICS.map((v) => ({ value: v, label: tt(v) }))}
                onChange={(topic) => set({ topic })}
            />
            <Choice<number>
                legend={t('moreLength')}
                value={draft.length}
                options={LENGTHS.map((v) => ({ value: v, label: t('months', { count: v }) }))}
                onChange={(length) => set({ length })}
            />
            <Choice<string>
                legend={t('moreStart')}
                value={draft.start}
                options={nextMonths().map((v) => ({
                    value: v,
                    label: format.dateTime(new Date(`${v}-01T00:00:00`), { month: 'short', year: 'numeric' }),
                }))}
                onChange={(start) => set({ start })}
            />
            <Choice<WorkMode>
                legend={t('moreMode')}
                value={draft.mode}
                options={MODES.map((v) => ({ value: v, label: tm(v) }))}
                onChange={(mode) => set({ mode })}
            />
            <label className="flex flex-col gap-2.5">
                <span className="font-display text-[17px] font-extrabold tracking-tightish">{t('moreCity')}</span>
                <input
                    type="text"
                    value={draft.location}
                    maxLength={200}
                    placeholder={t('anywhere')}
                    onChange={(e) => set({ location: e.target.value })}
                    className={cn('h-11 rounded-xl border border-line-input bg-white px-3.5 text-[15px] text-ink placeholder:text-ink-3')}
                />
            </label>
            <div className="mt-auto flex gap-2.5 pt-2">
                <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => set({ topic: undefined, length: undefined, start: undefined, mode: undefined, location: '' })}
                >
                    {t('moreReset')}
                </Button>
                <Button
                    className="flex-1"
                    onClick={() => {
                        onApply(draft)
                        onClose()
                    }}
                >
                    {t('moreApply')}
                </Button>
            </div>
        </Drawer>
    )
}
