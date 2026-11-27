'use client'

import { useState, type KeyboardEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import type { Resume } from '@/types/resume'
import type { RecruiterSearchInput } from '@/types/recruiter'
import {
    addKeyword,
    buildSearch,
    CONTACTS_DEFAULT,
    CONTACTS_MAX,
    CONTRACTS,
    COUNTRIES,
    countryName,
    GOAL_MAX,
    KEYWORD_MAX,
    KEYWORDS_MAX,
    type Contract,
} from './outreach'

const label = 'flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2'
const chip = 'hit inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-[13px] font-medium'

// SearchPanel is the radar's search: the CV (its skills are searched too), what the student wants (goal, contract,
// keywords), the country and how many people to find. email-api finds the companies and the people.
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
    const locale = useLocale()
    const [contract, setContract] = useState<Contract | ''>('pfe')
    const [keywords, setKeywords] = useState<string[]>([])
    const [typed, setTyped] = useState('')
    const [country, setCountry] = useState<string>('TN')
    const [contacts, setContacts] = useState(CONTACTS_DEFAULT)

    const take = () => {
        setKeywords((k) => addKeyword(k, typed))
        setTyped('')
    }
    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            take()
        } else if (e.key === 'Backspace' && !typed && keywords.length) {
            setKeywords((k) => k.slice(0, -1))
        }
    }
    const input = buildSearch({ resumeId, goal, contract, keywords: addKeyword(keywords, typed), country, contacts })

    return (
        <form
            aria-label={t('title')}
            className="flex flex-col gap-4 rounded-[20px] border border-ink bg-white p-4 shadow-card sm:p-5"
            onSubmit={(e) => {
                e.preventDefault()
                if (!input || busy || disabled) return
                if (typed.trim()) take()
                onSearch(input)
            }}
        >
            <h2 className="m-0 flex items-center gap-2 text-lg font-bold">
                <Icon name="radar" /> {t('title')}
            </h2>

            <label className={label}>
                {t('resume')}
                <Select className={inputClass} value={resumeId} required onChange={(e) => onResume(e.target.value)}>
                    {resumes.length ? null : <option value="">{t('noResume')}</option>}
                    {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.title}
                        </option>
                    ))}
                </Select>
            </label>

            <label className={label}>
                {t('goal')}
                <textarea
                    className={cn(inputClass, 'h-auto min-h-[88px] resize-y py-2.5')}
                    dir="auto"
                    rows={3}
                    maxLength={GOAL_MAX}
                    placeholder={t('goalPlaceholder')}
                    value={goal}
                    onChange={(e) => onGoal(e.target.value)}
                />
                <span className="self-end text-[11.5px] font-normal text-ink-4" aria-hidden="true">
                    {goal.length}/{GOAL_MAX}
                </span>
            </label>

            <div className={label}>
                <span id="radar-contract">{t('contract')}</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="radar-contract">
                    {CONTRACTS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            aria-pressed={contract === c}
                            onClick={() => setContract(contract === c ? '' : c)}
                            className={cn(chip, contract === c ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink-2')}
                        >
                            {t(`contracts.${c}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={label}>
                <span id="radar-keywords">{t('keywords')}</span>
                <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-line-strong bg-white p-1.5 focus-within:border-ink">
                    {keywords.map((k) => (
                        <span
                            key={k}
                            className="inline-flex h-8 min-w-0 max-w-full items-center gap-1 rounded-full bg-violet-soft ps-3 pe-1 text-[13px] text-violet"
                        >
                            <span className="truncate">{k}</span>
                            <button
                                type="button"
                                aria-label={t('removeKeyword', { keyword: k })}
                                onClick={() => setKeywords((all) => all.filter((x) => x !== k))}
                                className="hit flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-violet"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {keywords.length < KEYWORDS_MAX ? (
                        <input
                            aria-labelledby="radar-keywords"
                            dir="auto"
                            maxLength={KEYWORD_MAX}
                            className="h-8 min-w-[120px] flex-1 border-0 bg-transparent px-1.5 text-[15px] outline-none"
                            placeholder={keywords.length ? '' : t('keywordsPlaceholder')}
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            onKeyDown={onKey}
                            onBlur={take}
                        />
                    ) : null}
                </div>
                <span className="text-[12px] font-normal text-ink-3">{t('keywordsHint', { max: KEYWORDS_MAX })}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                    {t('country')}
                    <Select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>
                        {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                                {countryName(c, locale)}
                            </option>
                        ))}
                    </Select>
                </label>
                <label className={label}>
                    {t('contacts')}
                    <Select className={inputClass} value={contacts} onChange={(e) => setContacts(Number(e.target.value))}>
                        {Array.from({ length: CONTACTS_MAX }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                                {t('contactsCount', { count: n })}
                            </option>
                        ))}
                    </Select>
                </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" className="flex-[1_1_200px] sm:flex-none" disabled={!input || busy || disabled}>
                    <Icon name="radar" /> {busy ? t('searching') : t('find')}
                </Button>
                {!resumeId ? <span className="text-[12.5px] text-ink-3">{t('needResume')}</span> : null}
            </div>
        </form>
    )
}
