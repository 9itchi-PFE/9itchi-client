'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { resumeKeys, useAtsCheck, useResume } from '@/hooks/useResumes'
import { cn } from '@/lib/cn'
import AiService from '@/services/AiService'
import ResumeService from '@/services/ResumeService'
import { normalize, type ResumeContent, type RuleGroup, type RuleResult } from '@/types/resume'
import { fileBase } from '../editor/fileBase'
import { itemOfPath, sectionOfPath } from '../editor/sections'

const GROUPS: (RuleGroup | 'all')[] = ['all', 'contact', 'summary', 'experience', 'education', 'skills', 'layout', 'file']
const WITH_EXAMPLE = new Set(['number_style', 'no_skill_ratings'])
// seenFixes counts the points to correct in the groups the plan shows.
export const seenFixes = (rules: { status: string }[]) => rules.filter((r) => r.status === 'fix').length

const BULLET_RULES = new Set(['action_verbs', 'quantified_results', 'short_bullets', 'no_first_person', 'number_style'])

// setAt writes text at a JSON path such as experience[0].description[1] or summary.
function setAt(c: ResumeContent, where: string, text: string): ResumeContent | null {
    const m = where.match(/^(experience|projects)\[(\d+)\]\.description\[(\d+)\]$/)
    if (m) {
        const list = [...(c[m[1] as 'experience' | 'projects'] ?? [])]
        const i = Number(m[2])
        const j = Number(m[3])
        if (!list[i]) return null
        list[i] = { ...list[i], description: list[i].description.map((d, k) => (k === j ? text : d)) }
        return { ...c, [m[1]]: list }
    }
    if (where === 'summary') return { ...c, summary: text }
    return null
}

export default function CvCheck({ id }: { id: string }) {
    const t = useTranslations('check')
    const tc = useTranslations('common')
    const th = useTranslations('header')
    const resume = useResume(id)
    const check = useAtsCheck(id)
    const [group, setGroup] = useState<RuleGroup | 'all'>('all')
    const [onlyFix, setOnlyFix] = useState(true)

    const rules = useMemo(() => check.data?.rules ?? [], [check.data])
    const counts = useMemo(() => {
        const m = new Map<string, number>()
        for (const r of rules) if (r.status === 'fix') m.set(r.group, (m.get(r.group) ?? 0) + 1)
        return m
    }, [rules])
    if (!resume.data || !check.data) {
        return <p className="mx-auto max-w-[1320px] px-8 py-16 text-ink-3">{check.isError || resume.isError ? tc('error') : tc('loading')}</p>
    }
    const { passed, total, to_fix } = check.data
    const locked = new Set<RuleGroup>(check.data.locked_groups ?? [])
    const seen = seenFixes(rules)
    const hidden = Math.max(0, to_fix - seen)
    const shown = rules.filter((r) => r.status !== 'locked' && (group === 'all' || r.group === group) && (!onlyFix || r.status !== 'ok'))
    const lockedHere = group === 'all' ? locked.size > 0 : locked.has(group)
    const content = normalize(resume.data.content)

    return (
        <div className="mx-auto box-border flex w-full max-w-[1320px] flex-col gap-[22px] px-8 pb-16 pt-6">
            <nav aria-label={t('breadcrumbLabel')} className="flex items-center gap-2 text-sm text-ink-3">
                <Link href={`/resumes/${id}`}>{th('cv')}</Link>
                <span aria-hidden>/</span>
                <span className="text-ink">{t('breadcrumb')}</span>
            </nav>
            <div className="flex flex-wrap items-start gap-7">
                <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
                    <div className="flex flex-col gap-3.5 rounded-[14px] border-[1.5px] border-ink bg-white p-[22px] shadow-card">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{t('eyebrow')}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="font-display text-[52px] font-extrabold leading-none">{passed}</span>
                            <span className="text-lg font-semibold text-ink-3">{t('rulesOf', { total })}</span>
                        </div>
                        <div className="flex gap-[3px]" aria-hidden>
                            {rules.map((r) => (
                                <span
                                    key={r.id}
                                    className="h-2 flex-1 rounded-sm"
                                    style={{ background: r.status === 'locked' ? '#D0D5DD' : r.status === 'fix' ? '#F7B27A' : '#9DB82A' }}
                                />
                            ))}
                        </div>
                        <p className="m-0 text-sm leading-[1.55] text-ink-2">{to_fix ? t('verdictFix', { count: to_fix }) : t('verdictDone')}</p>
                        <ButtonLink href={`/resumes/${id}`} className="h-11 rounded-[10px]">
                            {t('back')}
                        </ButtonLink>
                    </div>
                    <nav aria-label={t('groupsLabel')} className="flex flex-col rounded-[18px] border border-line-soft bg-white p-2">
                        {GROUPS.map((g) => {
                            const n = g === 'all' ? seen : (counts.get(g) ?? 0)
                            const on = g === group
                            const closed = g !== 'all' && locked.has(g)
                            return (
                                <button
                                    key={g}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => setGroup(g)}
                                    className={cn(
                                        'flex h-10 cursor-pointer items-center justify-between rounded-lg border-0 px-3 text-start text-sm',
                                        on ? 'bg-fill font-semibold' : 'bg-transparent font-medium hover:bg-fill-3',
                                    )}
                                >
                                    <span>{t(`groups.${g}`)}</span>
                                    {closed ? (
                                        <span className="rounded-full bg-fill px-2 py-0.5 text-[11.5px] font-semibold text-ink-3">{t('lockedTag')}</span>
                                    ) : (
                                        <span className={cn('text-xs font-semibold', n ? 'text-warn-fg' : 'text-ok-fg')}>
                                            {n ? t('groupCount', { count: n }) : '✓'}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </nav>
                    <div className="flex flex-col gap-2 rounded-[18px] border border-line-soft bg-white p-4 text-[13.5px] leading-[1.55] text-ink-2">
                        <strong className="text-sm text-ink">{t('whyTitle')}</strong>
                        {t('whyText')}
                    </div>
                </aside>

                <section aria-label={t('rulesLabel')} className="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h1 className="m-0 text-[40px] font-extrabold leading-[1.08]">{onlyFix ? t('titleFix', { count: seen }) : t('titleAll')}</h1>
                            <p className="m-0 text-[15px] text-ink-3">{onlyFix ? t('subtitleFix') : t('subtitleAll')}</p>
                        </div>
                        <div role="group" aria-label={t('filterLabel')} className="flex overflow-hidden rounded-lg border border-line-strong bg-white">
                            {[true, false].map((v) => (
                                <button
                                    key={String(v)}
                                    type="button"
                                    aria-pressed={onlyFix === v}
                                    onClick={() => setOnlyFix(v)}
                                    className={cn(
                                        'h-9 cursor-pointer border-0 px-3.5 text-sm font-medium',
                                        onlyFix === v ? 'bg-violet-soft text-violet-hover' : 'bg-white text-ink-2',
                                    )}
                                >
                                    {v ? t('showFix') : t('showAll')}
                                </button>
                            ))}
                        </div>
                    </div>
                    {shown.map((r) => (
                        <RuleCard key={r.id} rule={r} resumeId={id} content={content} language={resume.data.language} title={resume.data.title} />
                    ))}
                    {lockedHere ? (
                        <article className="flex flex-col gap-3 rounded-xl border border-dashed border-line-strong bg-white p-[18px]">
                            <strong className="text-base">
                                {group === 'all' ? t('lockedTitle', { count: locked.size }) : t('lockedTitleOne', { group: t(`groups.${group}`) })}
                            </strong>
                            {group === 'all' ? (
                                <p className="m-0 text-[14.5px] leading-[1.55] text-ink-2">
                                    {GROUPS.filter((g): g is RuleGroup => g !== 'all' && locked.has(g))
                                        .map((g) => t(`groups.${g}`))
                                        .join(' · ')}
                                </p>
                            ) : null}
                            <p className="m-0 text-[14.5px] leading-[1.55] text-ink-3">{hidden ? t('lockedText', { count: hidden }) : t('lockedTextNone')}</p>
                            <ButtonLink href="/settings/billing" className="self-start">
                                {t('lockedButton')}
                            </ButtonLink>
                        </article>
                    ) : null}
                </section>
            </div>
        </div>
    )
}

function RuleCard({
    rule,
    resumeId,
    content,
    language,
    title,
}: {
    rule: RuleResult
    resumeId: string
    content: ResumeContent
    language: string | null
    title: string
}) {
    const t = useTranslations('check')
    const toast = useToast()
    const router = useRouter()
    const qc = useQueryClient()
    const [busy, setBusy] = useState(false)
    const isBullet = rule.status === 'fix' && BULLET_RULES.has(rule.id) && !!rule.where
    const isSummary = rule.status === 'fix' && rule.id === 'summary' && rule.where === 'summary' && !!rule.was
    const lang = (language === 'en' || language === 'ar' ? language : 'fr') as 'fr' | 'en' | 'ar'

    // A proposal for a line comes from ai-api; numbers it cannot know stay as [NOMBRE].
    const suggestion = useQuery({
        queryKey: ['rewrite', resumeId, rule.id, rule.where, rule.was],
        queryFn: async () =>
            (await AiService.rewriteSection({ section: isSummary ? 'summary' : 'bullet', text: rule.was ?? '', language: lang })).data.suggestions[0] ?? '',
        enabled: (isBullet || isSummary) && !!rule.was,
        staleTime: Infinity,
        retry: false,
    })

    const section =
        sectionOfPath(rule.where) ?? (rule.id === 'certifications' ? 'certifications' : rule.group === 'contact' || rule.id === 'file_name' ? 'contact' : null)
    const { item, line } = itemOfPath(rule.where)
    const editHref = section
        ? `/resumes/${resumeId}?section=${section}&item=${item}${rule.where?.includes('description') ? `&line=${line}` : ''}`
        : `/resumes/${resumeId}`

    const found = (() => {
        if (rule.status !== 'fix') return null
        const where = rule.where ?? ''
        const named = (s: 'experience' | 'projects' | 'education') => {
            const x = content[s]?.[item] as { company?: string; name?: string; school?: string } | undefined
            return t(`where.${s}`, { name: x?.company || x?.name || x?.school || item + 1 })
        }
        switch (rule.id) {
            case 'contact_details': {
                const missing = where.endsWith('phone')
                    ? 'phoneMissing'
                    : where.endsWith('email')
                      ? 'emailMissing'
                      : where.endsWith('location')
                        ? 'locationMissing'
                        : 'contact'
                const now = where.endsWith('phone') ? [content.contact.email, t('where.yourNumber'), content.contact.location].filter(Boolean).join(' · ') : ''
                return {
                    label: t(`where.${missing}`),
                    was: [content.contact.email, content.contact.phone, content.contact.location].filter(Boolean).join(' · '),
                    now,
                    action: where.endsWith('phone') ? t('actions.addPhone') : t('actions.edit'),
                }
            }
            case 'certifications':
                return {
                    label: t('where.certificationsEmpty'),
                    was: t('where.noCertification'),
                    now: t('where.certExample'),
                    action: t('actions.addCertification'),
                }
            case 'file_name':
                return {
                    label: t('where.fileName'),
                    was: rule.was ?? title,
                    now: rule.now ?? `${fileBase(content.contact.name, title)}.pdf`,
                    action: t('actions.rename'),
                }
            default: {
                const head = where.split(/[.[]/)[0]
                const label =
                    head === 'experience' || head === 'projects' || head === 'education'
                        ? named(head)
                        : head
                          ? t(`where.${head === 'skill_groups' ? 'skills' : head}` as 'where.skills')
                          : t('where.layout')
                const now = isBullet || isSummary ? (suggestion.data ?? '') : ''
                const action = rule.id === 'quantified_results' ? t('actions.useNumber') : isBullet || isSummary ? t('actions.use') : t('actions.edit')
                return { label, was: rule.was ?? '', now, action }
            }
        }
    })()

    const apply = async () => {
        if (!found) return
        if ((isBullet || isSummary) && found.now && rule.where) {
            const next = setAt(content, rule.where, found.now)
            if (next) {
                setBusy(true)
                try {
                    await ResumeService.createVersion(resumeId, 'bullet_rewritten')
                    const { data } = await ResumeService.updateResume(resumeId, { content: next })
                    qc.setQueryData(resumeKeys.one(resumeId), data)
                    await qc.invalidateQueries({ queryKey: resumeKeys.check(resumeId) })
                    qc.invalidateQueries({ queryKey: resumeKeys.versions(resumeId) })
                    toast(t('toastApplied'))
                } finally {
                    setBusy(false)
                }
                return
            }
        }
        router.push(editHref)
    }

    const tone = rule.status === 'ok' ? 'bg-ok-bg text-ok-fg' : rule.status === 'fix' ? 'bg-warn-bg text-warn-fg' : 'bg-violet-soft text-violet-hover'
    const mark = rule.status === 'ok' ? '✓' : rule.status === 'fix' ? '!' : 'i'
    const pending = (isBullet || isSummary) && suggestion.isFetching

    return (
        <article className={cn('rounded-xl bg-white p-[18px]', rule.status === 'fix' ? 'border border-warn-line' : 'border border-line')}>
            <div className="flex items-start gap-3.5">
                <span
                    className={cn('flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-xs font-bold', tone)}
                    aria-label={t(rule.status === 'ok' ? 'statusOk' : rule.status === 'fix' ? 'statusFix' : 'statusTip')}
                >
                    {mark}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="m-0 font-sans text-[15.5px] font-semibold tracking-normal">{t(`rules.${rule.id}.title`)}</h3>
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{t(`groups.${rule.group}`)}</span>
                    </div>
                    <p className="m-0 text-sm leading-[1.55] text-ink-3">{t(`rules.${rule.id}.why`)}</p>
                    {found ? (
                        <div className="mt-1.5 flex flex-col gap-2 rounded-lg border border-[#FCE3CF] bg-[#FFFAF5] px-3.5 py-3">
                            <span className="text-[13px] font-semibold text-warn-fg">{found.label}</span>
                            {found.was ? (
                                <span lang={language ?? 'fr'} dir="auto" className="text-sm leading-[1.55]">
                                    <span className="text-ink-4 line-through">{found.was}</span>
                                </span>
                            ) : null}
                            {found.now ? (
                                <span lang={language ?? 'fr'} dir="auto" className="text-sm leading-[1.55]">
                                    <span className="rounded-[3px] bg-lime px-[3px]">{found.now}</span>
                                </span>
                            ) : pending ? (
                                <span className="text-sm text-ink-3">{t('suggesting')}</span>
                            ) : (isBullet || isSummary) && suggestion.isFetched ? (
                                <span className="text-sm text-ink-3">{t('noSuggestion')}</span>
                            ) : null}
                            <div className="flex flex-wrap gap-2">
                                <Button className="h-9 rounded-lg px-3.5 text-[13.5px]" disabled={busy || pending} onClick={apply}>
                                    {found.now || !(isBullet || isSummary) ? found.action : t('actions.edit')}
                                </Button>
                                <Link href={editHref} className="inline-flex h-9 items-center px-3 text-[13.5px] font-medium no-underline">
                                    {t('fixYourself')}
                                </Link>
                            </div>
                        </div>
                    ) : null}
                    {WITH_EXAMPLE.has(rule.id) ? (
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[13.5px]">
                            <div className="rounded-lg border border-[#D1F0DC] bg-[#F2FBF5] px-3 py-2.5">
                                <span className="font-semibold text-ok-fg">{t('good')}</span>
                                <br />
                                {t(`rules.${rule.id}.good`)}
                            </div>
                            <div className="rounded-lg border border-line bg-fill-3 px-3 py-2.5">
                                <span className="font-semibold text-ink-3">{t('bad')}</span>
                                <br />
                                {t(`rules.${rule.id}.bad`)}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    )
}
