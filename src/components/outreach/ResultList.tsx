'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { Recruiter } from '@/types/recruiter'
import { companyInitial, faviconUrl, whyOf } from './outreach'

// CompanyLogo is the company's favicon when it has a domain, else its first letter.
function CompanyLogo({ r }: { r: Recruiter }) {
    const [broken, setBroken] = useState(false)
    const src = faviconUrl(r.domain)
    return (
        <span
            aria-hidden="true"
            className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl border border-line-soft bg-violet-soft"
        >
            {src && !broken ? (
                <img src={src} alt="" width={28} height={28} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
            ) : (
                <span className="font-display text-[17px] font-bold text-violet">{companyInitial(r.company, r.name)}</span>
            )}
        </span>
    )
}

// ResultList is the people of the last search as cards: who, why this company, and the button that writes the email.
export default function ResultList({ items, selectedId, onDraft }: { items: Recruiter[]; selectedId: string | null; onDraft: (id: string) => void }) {
    const t = useTranslations('outreach.results')

    if (!items.length) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-line-strong bg-white px-4 py-8 text-center">
                <Icon name="search" size={28} className="text-ink-4" />
                <strong className="text-[15px]">{t('emptyTitle')}</strong>
                <p className="m-0 max-w-[420px] text-sm text-ink-3">{t('emptyText')}</p>
            </div>
        )
    }

    return (
        <ul aria-label={t('title')} className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
            {items.map((r) => {
                const why = whyOf(r)
                const on = r.id === selectedId
                return (
                    <li
                        key={r.id}
                        className={cn('flex min-w-0 flex-col gap-2.5 rounded-[16px] border bg-white p-4', on ? 'border-ink shadow-card' : 'border-line-soft')}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <CompanyLogo r={r} />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <strong className="truncate text-[15px]">{[r.company, r.name].filter(Boolean).join(' · ')}</strong>
                                {r.title ? <span className="truncate text-[13.5px] text-ink-3">{r.title}</span> : null}
                            </div>
                        </div>
                        {r.company_summary ? <p className="m-0 line-clamp-2 text-[13.5px] text-ink-2">{r.company_summary}</p> : null}
                        {why.length ? (
                            <p className="m-0 text-[13px] text-ink-2">
                                <span className="font-semibold">{t('why')}</span> {why.join(', ')}
                            </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                            {r.verified ? (
                                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-ok-bg px-2 text-[11.5px] font-semibold text-ok-fg">
                                    <Icon name="check" size={12} /> {t('verified')}
                                </span>
                            ) : null}
                            {r.email ? (
                                <span className="min-w-0 truncate text-[13px] text-ink-2" dir="ltr">
                                    {r.email}
                                </span>
                            ) : (
                                <span className="text-[12.5px] text-ink-3">{t('noEmail')}</span>
                            )}
                        </div>
                        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
                            <Button size="sm" className="flex-[1_1_160px]" onClick={() => onDraft(r.id)}>
                                <Icon name="pencil" size={16} /> {t('draft')}
                            </Button>
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
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
