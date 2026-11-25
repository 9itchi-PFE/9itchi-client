'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useResume, useResumes } from '@/hooks/useResumes'
import { cn } from '@/lib/cn'
import JobService from '@/services/JobService'
import { TOPICS, emptyPreferences, type Preferences, type WorkMode } from '@/types/preferences'
import { normalize } from '@/types/resume'
import { KNOWN_PLACES, guessFromCv, monthOptions } from './guess'

type Key = keyof Preferences
type Badge = 'cv' | 'guess' | 'ask' | 'required' | null

const SKILL_EXTRAS = ['Docker', 'JavaScript', 'SQL', 'Java', 'Python', 'Git']

// PreferencesFlow is screen 1.3: questions answered from the CV where it can (with where it came from),
// the two it cannot answer, and the live count of offers that fit.
export default function PreferencesFlow() {
    const t = useTranslations('prefs')
    const format = useFormatter()
    const router = useRouter()
    const qc = useQueryClient()
    const saved = useQuery({ queryKey: ['preferences'], queryFn: async () => (await JobService.getPreferences()).data })
    const list = useResumes()
    const latest = [...(list.data?.items ?? [])].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
    const resume = useResume(latest?.id ?? '')
    const ready = saved.isFetched && list.isFetched && (!latest || resume.isFetched)

    const guess = useMemo(() => guessFromCv(resume.data ? normalize(resume.data.content) : undefined), [resume.data])
    const fromCv = !saved.data?.updated_at && guess.fromCv.size > 0
    const [prefs, setPrefs] = useState<Preferences | null>(null)
    const [guessedMode, setGuessedMode] = useState(false)
    useEffect(() => {
        if (!ready || prefs) return
        if (saved.data?.updated_at) {
            const d = saved.data
            setPrefs({
                topics: d.topics,
                skills: d.skills,
                places: d.places,
                work_modes: d.work_modes,
                start_month: d.start_month,
                durations: d.durations,
            })
        } else if (guess.fromCv.size) {
            // No answer saved yet: start from the CV, and guess hybrid work, flagged « Deviné, vérifie ».
            setPrefs({ ...guess.prefs, work_modes: ['hybrid'] })
            setGuessedMode(true)
        } else setPrefs(emptyPreferences())
    }, [ready, prefs, saved.data, guess])

    const [count, setCount] = useState<number | null>(null)
    useEffect(() => {
        if (!prefs) return
        const timer = setTimeout(async () => {
            try {
                setCount((await JobService.previewPreferences(prefs)).data.count)
            } catch {
                setCount(null)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [prefs])

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    if (!prefs) return <p className="mx-auto max-w-[1200px] px-4 sm:px-8 py-16 text-ink-3">…</p>

    const set = <K extends Key>(k: K, v: Preferences[K]) => {
        setPrefs({ ...prefs, [k]: v })
        if (k === 'work_modes') setGuessedMode(false)
    }
    const toggleIn = <T extends string | number>(k: 'work_modes' | 'durations', v: T) => {
        const cur = prefs[k] as T[]
        set(k, (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]) as Preferences[typeof k])
    }
    const toggle = (k: 'topics' | 'skills' | 'places', v: string) => {
        const cur = prefs[k] as string[]
        let next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
        if (k === 'places') next = v === 'anywhere' && next.includes('anywhere') ? ['anywhere'] : next.filter((x) => x !== 'anywhere' || v === 'anywhere')
        set(k, next as Preferences[typeof k])
    }

    const monthLabel = (m: string) => {
        const [y, mo] = m.split('-').map(Number)
        const s = format.dateTime(new Date(Date.UTC(y, mo - 1, 1)), { month: 'long', year: 'numeric', timeZone: 'UTC' })
        return s.charAt(0).toUpperCase() + s.slice(1)
    }
    const placeLabel = (p: string) => (p === 'remote' || p === 'anywhere' ? t(`places.${p}`) : p)
    const skillOptions = [...prefs.skills, ...guess.prefs.skills, ...SKILL_EXTRAS]
        .filter((s, i, a) => a.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i)
        .slice(0, 10)
    const placeOptions = [...new Set([...prefs.places, ...KNOWN_PLACES])]
    const startOptions = [...new Set([...monthOptions(prefs.start_month ?? guess.prefs.start_month), ...(prefs.start_month ? [prefs.start_month] : [])])].sort()

    const empty = (k: Key) => (Array.isArray(prefs[k]) ? (prefs[k] as unknown[]).length === 0 : prefs[k] === null)
    const badge = (k: Key): Badge => {
        if (k === 'work_modes' && guessedMode) return 'guess'
        if (fromCv && guess.fromCv.has(k)) return 'cv'
        return empty(k) ? 'required' : null
    }
    const left = (Object.keys(prefs) as Key[]).filter(empty).length
    // notInCv counts the questions the CV could not answer, for the subtitle; it does not change as the student answers.
    const notInCv = (Object.keys(prefs) as Key[]).filter((k) => !guess.fromCv.has(k) && !(k === 'work_modes' && guessedMode)).length

    type Q = { key: Key; title: string; why: string; options: { label: string; on: boolean; pick: () => void }[] }
    const questions: Q[] = [
        {
            key: 'topics',
            title: t('qTopics'),
            why: t('whyTopics'),
            options: TOPICS.map((x) => ({ label: t(`topics.${x}`), on: prefs.topics.includes(x), pick: () => toggle('topics', x) })),
        },
        {
            key: 'skills',
            title: t('qSkills'),
            why: t('whySkills'),
            options: skillOptions.map((x) => ({ label: x, on: prefs.skills.includes(x), pick: () => toggle('skills', x) })),
        },
        {
            key: 'places',
            title: t('qPlaces'),
            why: t('whyPlaces'),
            options: placeOptions.map((x) => ({ label: placeLabel(x), on: prefs.places.includes(x), pick: () => toggle('places', x) })),
        },
        {
            key: 'work_modes',
            title: t('qMode'),
            why: t('whyGuess'),
            options: (['on_site', 'hybrid', 'remote'] as WorkMode[]).map((x) => ({
                label: t(`modes.${x}`),
                on: prefs.work_modes.includes(x),
                pick: () => toggleIn('work_modes', x),
            })),
        },
        {
            key: 'start_month',
            title: t('qStart'),
            why: t('whyStart'),
            options: startOptions.map((m) => ({
                label: monthLabel(m),
                on: prefs.start_month === m,
                pick: () => set('start_month', prefs.start_month === m ? null : m),
            })),
        },
        {
            key: 'durations',
            title: t('qLength'),
            why: t('whyLength'),
            options: [...new Set([2, 3, 4, 5, 6, ...prefs.durations])]
                .sort((a, b) => a - b)
                .map((n) => ({
                    label: t('months', { count: n }),
                    on: prefs.durations.includes(n),
                    pick: () => toggleIn('durations', n),
                })),
        },
    ]

    const save = async () => {
        setSaving(true)
        setError('')
        try {
            const { data } = await JobService.savePreferences(prefs)
            qc.setQueryData(['preferences'], data)
            router.push('/jobs')
        } catch {
            setError(t('saveError'))
            setSaving(false)
        }
    }

    const join = (xs: string[]) => (xs.length ? xs.join(', ') : '—')
    const summary: [string, string][] = [
        [t('sumTopics'), join(prefs.topics.map((x) => t(`topics.${x}`)))],
        [t('sumSkills'), join(prefs.skills)],
        [t('sumPlaces'), join(prefs.places.map(placeLabel))],
        [t('sumStart'), prefs.start_month ? monthLabel(prefs.start_month) : '—'],
        [t('sumMode'), join(prefs.work_modes.map((x) => t(`modes.${x}`)))],
        [t('sumLength'), join(prefs.durations.map((n) => t('months', { count: n })))],
    ]

    return (
        <main className="mx-auto box-border flex w-full max-w-[1200px] flex-col gap-6 px-4 sm:px-8 pb-[72px] pt-5">
            <div className="flex max-w-[760px] flex-col gap-2">
                <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{fromCv ? t('titleCv') : t('titleBlank')}</h1>
                <p className="m-0 text-base leading-[1.55] text-ink-3">{fromCv ? t('subtitleCv', { count: notInCv }) : t('subtitleBlank')}</p>
            </div>
            <div className="flex flex-wrap items-start gap-7">
                <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-3">
                    {questions.map((q) => {
                        const b = badge(q.key)
                        const warn = (b === 'ask' && empty(q.key)) || b === 'guess' || (b === 'required' && !fromCv)
                        return (
                            <section
                                key={q.key}
                                aria-labelledby={`q-${q.key}`}
                                className={cn('flex flex-col gap-3 rounded-[18px] border bg-white p-5', warn ? 'border-warn-line' : 'border-line-soft')}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 id={`q-${q.key}`} className="m-0 font-sans text-base font-semibold tracking-normal">
                                        {q.title}
                                    </h2>
                                    {b === 'cv' ? (
                                        <span className="inline-flex h-[22px] items-center gap-[5px] rounded-full bg-violet-soft px-2 text-[11.5px] font-semibold text-violet-hover">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                                                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                                                <path d="M14 3v5h5" />
                                            </svg>
                                            {q.why}
                                        </span>
                                    ) : b ? (
                                        <span className="inline-flex h-[22px] items-center rounded-full bg-warn-bg px-2 text-[11.5px] font-semibold text-warn-fg">
                                            {b === 'required' ? t('required') : q.why}
                                        </span>
                                    ) : null}
                                </div>
                                <div role="group" aria-labelledby={`q-${q.key}`} className="flex flex-wrap gap-2">
                                    {q.options.map((o) => (
                                        <button
                                            key={o.label}
                                            type="button"
                                            aria-pressed={o.on}
                                            onClick={o.pick}
                                            className={cn(
                                                'h-10 cursor-pointer rounded-full border px-3.5 text-sm',
                                                o.on
                                                    ? 'border-ink bg-ink font-semibold text-white'
                                                    : 'border-line-strong bg-white font-medium text-ink-2 hover:border-ink-4',
                                            )}
                                        >
                                            {o.on ? '✓ ' : ''}
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>
                <aside className="sticky top-6 flex min-w-0 flex-[1_1_320px] flex-col gap-[18px] rounded-[20px] border-[1.5px] border-ink bg-white p-6 shadow-card">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{t('eyebrow')}</span>
                    <div className="flex items-baseline gap-2" aria-live="polite">
                        <span className="font-display text-[56px] font-extrabold leading-none">{count ?? '—'}</span>
                        <span className="text-base font-semibold text-ink-3">{t('offers')}</span>
                    </div>
                    <dl className="m-0 flex flex-col gap-2 text-sm text-ink-2">
                        {summary.map(([k, v]) => (
                            <div key={k} className="flex gap-2.5">
                                <dt className="w-[92px] flex-none text-ink-3">{k}</dt>
                                <dd className="m-0 font-semibold">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    {left ? <span className="text-[13.5px] font-semibold text-warn-fg">{t('left', { count: left })}</span> : null}
                    {error ? (
                        <span role="alert" className="text-[13.5px] text-warn-fg">
                            {error}
                        </span>
                    ) : null}
                    <button
                        type="button"
                        disabled={left > 0 || saving}
                        onClick={save}
                        className={cn(
                            'flex h-[54px] items-center justify-center rounded-[14px] border-0 text-base font-semibold',
                            left > 0 ? 'cursor-not-allowed bg-fill text-ink-3' : 'cursor-pointer bg-ink text-white',
                        )}
                    >
                        {left > 0 ? t('ctaWait') : fromCv ? t('ctaCv') : t('ctaBlank')}
                    </button>
                    <span className="text-center text-[12.5px] leading-normal text-ink-3">{t('note')}</span>
                </aside>
            </div>
        </main>
    )
}
