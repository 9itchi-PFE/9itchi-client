'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useTemplates } from '@/hooks/useTemplates'
import type { Resume } from '@/types/resume'
import { allSkills, join, splitLanguage } from '../cvText'
import FileBadge from './FileBadge'

type Row = { label: string; value: string; ok: boolean }

// ImportResult is screen 1.2c: what was found on the left, what changed on the right.
export default function ImportResult({ resume, fileName, onOther }: { resume: Resume; fileName: string; onOther: () => void }) {
    const t = useTranslations('import')
    const locale = useLocale()
    const tt = useTranslations('templates.layouts')
    const templates = useTemplates().data
    const c = resume.content
    const report = resume.parse_report
    const layout = templates?.find((x) => x.id === resume.template_id)?.layout ?? 'classic'
    const city = c.contact.location.split(',')[0]?.trim()
    const skills = allSkills(c).length

    const rows: Row[] = [
        { label: t('rowContact'), value: join(' · ', c.contact.name, city), ok: !!c.contact.name },
        { label: t('rowEducation'), value: t('items', { count: c.education.length }), ok: c.education.length > 0 },
        { label: t('rowExperience'), value: t('items', { count: c.experience.length }), ok: c.experience.length > 0 },
        { label: t('rowProjects'), value: t('items', { count: c.projects?.length ?? 0 }), ok: (c.projects?.length ?? 0) > 0 },
        { label: t('rowSkills'), value: t('skills', { count: skills }), ok: skills > 0 },
        {
            label: t('rowLanguages'),
            // Language names are common nouns in French: only the first word of the list keeps its capital.
            value: c.languages.map((l, i) => (i > 0 && locale === 'fr' ? splitLanguage(l)[0].toLowerCase() : splitLanguage(l)[0])).join(', '),
            ok: c.languages.length > 0,
        },
    ]
    const found = rows.filter((r) => r.ok)
    const missing: Row[] = rows.filter((r) => !r.ok).map((r) => ({ ...r, value: t('missingSection') }))
    if (!c.contact.email) missing.push({ label: t('rowEmail'), value: t('missing'), ok: false })
    if (!c.contact.phone) missing.push({ label: t('rowPhone'), value: t('missing'), ok: false })

    const removed = (report?.removed ?? []).map((k) => t(`removed.${k}`))
    const list = new Intl.ListFormat(locale, { type: 'conjunction' }).format(removed)

    return (
        <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-[18px] rounded-[20px] border-[1.5px] border-ink bg-white p-7 shadow-card">
                <div className="flex items-center gap-3">
                    <FileBadge name={fileName || 'cv.pdf'} />
                    <div className="flex min-w-0 flex-col">
                        <strong className="truncate text-[15px]">{fileName || resume.title}</strong>
                        {report ? <span className="text-sm text-ink-3">{t('fileMeta', { pages: report.pages, seconds: report.seconds })}</span> : null}
                    </div>
                    <Button variant="secondary" className="ms-auto h-[38px] rounded-lg border-line-input px-3 font-medium" onClick={onOther}>
                        {t('otherFile')}
                    </Button>
                </div>
                <h1 className="m-0 text-[28px] font-extrabold">{t('foundTitle')}</h1>
                <div>
                    {[...found, ...missing].map((r, i, all) => (
                        <div key={r.label} className={`flex items-center gap-3 py-3 text-[15px] ${i < all.length - 1 ? 'border-b border-line' : ''}`}>
                            {r.ok ? (
                                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-ok-bg text-ok-fg">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden>
                                        <path d="m5 12 5 5 9-10" />
                                    </svg>
                                </span>
                            ) : (
                                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-warn-bg text-[13px] font-bold text-warn-fg">
                                    !
                                </span>
                            )}
                            {r.label}
                            <span className={`ms-auto text-end text-sm ${r.ok ? 'text-ink-3' : 'text-warn-fg'}`}>{r.value}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-[22px]">
                    <h2 className="m-0 text-lg font-bold">{t('changesTitle')}</h2>
                    <ul className="m-0 flex list-disc flex-col gap-2 ps-[18px] text-sm leading-normal text-ink-2">
                        <li>{t('changeOnePage')}</li>
                        {report && report.rewritten > 0 ? <li>{t('changeRewritten', { count: report.rewritten })}</li> : null}
                        {removed.length ? <li>{t('changeRemoved', { list })}</li> : null}
                        <li>{t('changeTemplate', { name: tt(`${layout}.name`) })}</li>
                    </ul>
                </div>
                <ButtonLink href="/preferences" size="lg" className="h-[52px] text-base">
                    {t('continue')}
                </ButtonLink>
                <Link href={`/resumes/${resume.id}`} className="text-center text-sm font-medium underline">
                    {t('review')}
                </Link>
            </div>
        </div>
    )
}
