'use client'

import { useState, type KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { Resume } from '@/types/resume'
import type { RecruiterSearchInput } from '@/types/recruiter'
import { CONTRACTS, domainOf } from './outreach'

const MAX_KEYWORDS = 10
const label = 'flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2'
const chip = 'hit inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-[13px] font-medium'

// SearchPanel is the radar's search: the CV (its skills are searched too), keywords, a company and where; the goal
// is not searched, it tells the AI what the email asks for.
export default function SearchPanel({
    resumes,
    resumeId,
    onResume,
    goal,
    onGoal,
    busy,
    disabled,
    onSearch,
}: {
    resumes: Pick<Resume, 'id' | 'title'>[]
    resumeId: string
    onResume: (id: string) => void
    goal: string
    onGoal: (goal: string) => void
    busy: boolean
    disabled: boolean
    onSearch: (input: RecruiterSearchInput) => void
}) {
    const t = useTranslations('outreach.search')
    const [keywords, setKeywords] = useState<string[]>([])
    const [typed, setTyped] = useState('')
    const [company, setCompany] = useState('')
    const [domain, setDomain] = useState('')
    const [location, setLocation] = useState('')

    const add = (word: string) => {
        const w = word.trim().slice(0, 60)
        if (!w || keywords.length >= MAX_KEYWORDS || keywords.some((k) => k.toLowerCase() === w.toLowerCase())) return
        setKeywords((k) => [...k, w])
    }
    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(typed)
            setTyped('')
        } else if (e.key === 'Backspace' && !typed && keywords.length) {
            setKeywords((k) => k.slice(0, -1))
        }
    }
    const words = typed.trim() ? [...keywords, typed.trim()].slice(0, MAX_KEYWORDS) : keywords
    const ready = !!resumeId || words.length > 0 || !!company.trim() || !!domain.trim()
    const suggestions = CONTRACTS.filter((c) => !keywords.includes(c))

    return (
        <form
            aria-label={t('title')}
            className="flex flex-col gap-4 rounded-[20px] border border-ink bg-white p-4 shadow-card sm:p-5"
            onSubmit={(e) => {
                e.preventDefault()
                if (!ready || busy || disabled) return
                if (typed.trim()) {
                    add(typed)
                    setTyped('')
                }
                onSearch({
                    resume_id: resumeId || undefined,
                    keywords: words,
                    company: company.trim() || undefined,
                    domain: domainOf(domain) || undefined,
                    location: location.trim() || undefined,
                })
            }}
        >
            <h2 className="m-0 flex items-center gap-2 text-lg font-bold">
                <Icon name="radar" /> {t('title')}
            </h2>

            <label className={label}>
                {t('resume')}
                <select className={inputClass} value={resumeId} onChange={(e) => onResume(e.target.value)}>
                    <option value="">{t('noResume')}</option>
                    {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.title}
                        </option>
                    ))}
                </select>
            </label>

            <div className={label}>
                <span id="radar-goal">{t('goal')}</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="radar-goal">
                    {CONTRACTS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            aria-pressed={goal === c}
                            onClick={() => onGoal(goal === c ? '' : c)}
                            className={cn(chip, goal === c ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink-2')}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                <input
                    className={inputClass}
                    aria-labelledby="radar-goal"
                    dir="auto"
                    maxLength={500}
                    placeholder={t('goalPlaceholder')}
                    value={goal}
                    onChange={(e) => onGoal(e.target.value)}
                />
            </div>

            <div className={label}>
                <span id="radar-keywords">{t('keywords')}</span>
                <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-line-strong bg-white p-1.5 focus-within:border-ink">
                    {keywords.map((k) => (
                        <span key={k} className="inline-flex h-8 items-center gap-1 rounded-full bg-violet-soft ps-3 pe-1 text-[13px] text-violet">
                            {k}
                            <button
                                type="button"
                                aria-label={t('removeKeyword', { keyword: k })}
                                onClick={() => setKeywords((all) => all.filter((x) => x !== k))}
                                className="hit flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-violet"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        aria-labelledby="radar-keywords"
                        dir="auto"
                        className="h-8 min-w-[120px] flex-1 border-0 bg-transparent px-1.5 text-[15px] outline-none"
                        placeholder={keywords.length ? '' : t('keywordsPlaceholder')}
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        onKeyDown={onKey}
                        onBlur={() => {
                            add(typed)
                            setTyped('')
                        }}
                    />
                </div>
                {suggestions.length ? (
                    <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => add(s)}
                                className={cn(chip, 'border-dashed border-line-strong bg-transparent text-ink-3')}
                            >
                                + {s}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <label className={label}>
                    {t('company')}
                    <input className={inputClass} dir="auto" maxLength={120} value={company} onChange={(e) => setCompany(e.target.value)} />
                </label>
                <label className={label}>
                    {t('domain')}
                    <input
                        className={inputClass}
                        dir="ltr"
                        maxLength={253}
                        placeholder="example.tn"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                    />
                </label>
                <label className={label}>
                    {t('location')}
                    <input
                        className={inputClass}
                        dir="auto"
                        maxLength={120}
                        placeholder={t('locationPlaceholder')}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" className="flex-[1_1_200px] sm:flex-none" disabled={!ready || busy || disabled}>
                    <Icon name="radar" /> {busy ? t('searching') : t('find')}
                </Button>
                {!ready ? <span className="text-[12.5px] text-ink-3">{t('needOne')}</span> : null}
            </div>
        </form>
    )
}
