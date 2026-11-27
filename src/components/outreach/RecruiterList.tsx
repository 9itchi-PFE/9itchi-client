'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { Segmented } from '@/components/ui/Segmented'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { Recruiter } from '@/types/recruiter'
import { emailOk, initials } from './outreach'

type Tab = 'all' | 'with' | 'without'

// confidence of the provider in the address it found, as a pill.
function Confidence({ value }: { value: number }) {
    const t = useTranslations('outreach.list')
    const level = value >= 80 ? 'high' : value >= 50 ? 'medium' : 'low'
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center rounded-full px-2 text-[11.5px] font-semibold',
                level === 'high' ? 'bg-ok-bg text-ok-fg' : level === 'medium' ? 'bg-warn-bg text-warn-fg' : 'bg-fill text-ink-3',
            )}
        >
            {t(`confidence.${level}`, { value })}
        </span>
    )
}

// AddEmail lets the student type the address the provider did not find (kept on this device only).
function AddEmail({ onSave }: { onSave: (email: string) => void }) {
    const t = useTranslations('outreach.list')
    const [value, setValue] = useState('')
    const ok = emailOk(value)
    return (
        <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
                e.preventDefault()
                if (ok) onSave(value.trim())
            }}
        >
            <input
                type="email"
                dir="ltr"
                aria-label={t('addEmail')}
                placeholder={t('addEmail')}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-9 min-w-0 flex-[1_1_160px] rounded-[10px] border border-dashed border-line-strong bg-white px-3 text-[15px]"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={!ok}>
                {t('save')}
            </Button>
        </form>
    )
}

// RecruiterList is every recruiter the radar found, with or without an email; selecting one opens the email.
export default function RecruiterList({
    items,
    loading,
    error,
    selectedId,
    onSelect,
    onEmail,
}: {
    items: Recruiter[]
    loading: boolean
    error: boolean
    selectedId: string | null
    onSelect: (id: string) => void
    onEmail: (id: string, email: string) => void
}) {
    const t = useTranslations('outreach.list')
    const [tab, setTab] = useState<Tab>('all')
    const withEmail = items.filter((r) => r.email)
    const shown = tab === 'all' ? items : tab === 'with' ? withEmail : items.filter((r) => !r.email)

    return (
        <section id="radar-list" aria-label={t('title')} className="flex min-w-0 scroll-mt-[84px] flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0 text-lg font-bold">{t('title')}</h2>
                <Segmented
                    label={t('title')}
                    value={tab}
                    onChange={setTab}
                    className="max-w-full overflow-x-auto"
                    options={[
                        { value: 'all', label: t('all', { count: items.length }) },
                        { value: 'with', label: t('with', { count: withEmail.length }) },
                        { value: 'without', label: t('without', { count: items.length - withEmail.length }) },
                    ]}
                />
            </div>

            {loading ? (
                <div className="flex justify-center rounded-[16px] border border-line-soft bg-white p-6">
                    <Spinner label={t('loading')} size={48} />
                </div>
            ) : error ? (
                <p role="alert" className="m-0 rounded-[16px] border border-warn-line bg-warn-bg p-4 text-sm text-warn-fg">
                    {t('error')}
                </p>
            ) : shown.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-line-strong bg-white px-4 py-8 text-center">
                    <Icon name="radar" size={28} className="text-ink-4" />
                    <p className="m-0 text-sm text-ink-3">{items.length ? t('emptyTab') : t('empty')}</p>
                </div>
            ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {shown.map((r) => {
                        const on = r.id === selectedId
                        return (
                            <li
                                key={r.id}
                                className={cn(
                                    'flex flex-col gap-2 rounded-[16px] border bg-white p-3 transition-colors',
                                    on ? 'border-ink shadow-card' : 'border-line-soft hover:border-line-strong',
                                )}
                            >
                                <button
                                    type="button"
                                    aria-current={on ? 'true' : undefined}
                                    onClick={() => onSelect(r.id)}
                                    className="flex w-full min-w-0 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-start"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[15px] font-bold',
                                            on ? 'bg-ink text-lime' : 'bg-violet-soft text-violet',
                                        )}
                                    >
                                        {initials(r.name)}
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <strong className="truncate text-[15px] text-ink">{r.name}</strong>
                                        <span className="truncate text-[13.5px] text-ink-3">{[r.title, r.company].filter(Boolean).join(' · ')}</span>
                                    </span>
                                    <Icon name="right" className="flex-none text-ink-4 rtl:rotate-180" />
                                </button>
                                <div className="flex flex-wrap items-center gap-2 sm:ps-14">
                                    <Confidence value={r.confidence} />
                                    {r.linkedin_url ? (
                                        <a
                                            href={r.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            className="hit inline-flex items-center gap-1 text-[13px] font-medium text-violet"
                                        >
                                            <Icon name="link" size={14} /> LinkedIn
                                        </a>
                                    ) : null}
                                    {r.email ? (
                                        <span className="min-w-0 truncate text-[13px] text-ink-2" dir="ltr">
                                            {r.email}
                                        </span>
                                    ) : null}
                                </div>
                                {!r.email ? (
                                    <div className="flex flex-col gap-1 sm:ps-14">
                                        <span className="text-[12.5px] text-ink-3">{t('noEmail')}</span>
                                        <AddEmail onSave={(email) => onEmail(r.id, email)} />
                                    </div>
                                ) : null}
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
