'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { resumeKeys, usePhoto, useResume, useResumes } from '@/hooks/useResumes'
import { useTemplates } from '@/hooks/useTemplates'
import { cn } from '@/lib/cn'
import ResumeService from '@/services/ResumeService'
import { normalize, type Layout, type Template } from '@/types/resume'
import CvPreview from './CvPreview'

const ORDER: Layout[] = ['classic', 'modern', 'compact', 'sidebar', 'split', 'banner']

export default function TemplatePicker() {
    const t = useTranslations('templates')
    const th = useTranslations('header')
    const tc = useTranslations('common')
    const params = useSearchParams()
    const router = useRouter()
    const toast = useToast()
    const qc = useQueryClient()
    const list = useResumes().data
    const id = params.get('cv') ?? [...(list?.items ?? [])].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]?.id ?? ''
    const resume = useResume(id).data
    const photo = usePhoto(id, resume?.has_photo).data
    const templates = (useTemplates().data ?? [])
        .filter((x) => x.active !== false && ORDER.includes(x.layout))
        .sort((a, b) => ORDER.indexOf(a.layout) - ORDER.indexOf(b.layout))
    const current = templates.find((x) => x.id === resume?.template_id) ?? templates[0]
    const [picked, setPicked] = useState<Template | undefined>()
    useEffect(() => {
        if (!picked && current) setPicked(current)
    }, [current, picked])
    const [busy, setBusy] = useState(false)

    const use = async () => {
        if (!picked || !id) return
        setBusy(true)
        try {
            if (picked.id !== resume?.template_id) {
                await ResumeService.createVersion(id, 'template_changed')
                const { data } = await ResumeService.updateResume(id, { template_id: picked.id })
                qc.setQueryData(resumeKeys.one(id), data)
                qc.invalidateQueries({ queryKey: resumeKeys.versions(id) })
                qc.invalidateQueries({ queryKey: resumeKeys.check(id) })
                qc.invalidateQueries({ queryKey: resumeKeys.list })
            }
            toast(t('toastApplied', { name: t(`layouts.${picked.layout}.name`) }))
            router.push(`/resumes/${id}`)
        } catch {
            toast(tc('error'))
        } finally {
            setBusy(false)
        }
    }

    const content = normalize(resume?.content)
    const cvLang = resume?.language === 'en' ? 'en' : 'fr'
    const name = picked ? t(`layouts.${picked.layout}.name`) : ''

    return (
        <div className="mx-auto box-border flex w-full max-w-[1320px] flex-col gap-5 px-4 sm:px-8 pb-16 pt-6">
            <nav aria-label={th('cv')} className="flex items-center gap-2 text-sm text-ink-3">
                <Link href={id ? `/resumes/${id}` : '/resumes'}>{th('cv')}</Link>
                <span aria-hidden>/</span>
                <span className="text-ink">{t('breadcrumb')}</span>
            </nav>
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
                <p className="m-0 max-w-[1240px] text-[15.5px] leading-normal text-ink-3">{t('lead')}</p>
            </div>
            <Button className="h-11 self-start rounded-xl px-[18px] text-[15.5px]" disabled={!picked || !id || busy} onClick={use}>
                {t('use', { name })}
            </Button>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                {templates.map((tpl) => {
                    const on = picked?.id === tpl.id
                    return (
                        <button
                            key={tpl.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setPicked(tpl)}
                            className={cn(
                                'flex cursor-pointer flex-col gap-4 rounded-[18px] bg-white p-5 text-start',
                                on ? 'border-2 border-violet shadow-[0_0_0_4px_rgba(75,50,224,.12)]' : 'border border-line',
                            )}
                        >
                            <div className="pointer-events-none aspect-[210/297] overflow-hidden" aria-hidden>
                                <CvPreview content={content} layout={tpl.layout} language={cvLang} photoUrl={tpl.layout === 'compact' ? null : photo} />
                            </div>
                            <span className="flex flex-col gap-1.5">
                                <span className="flex items-center justify-between">
                                    <strong className="text-base">{t(`layouts.${tpl.layout}.name`)}</strong>
                                    {on ? (
                                        <span className="inline-flex h-6 items-center rounded-md bg-violet-soft px-2 text-xs font-semibold text-violet-hover">
                                            {t('chosen')}
                                        </span>
                                    ) : null}
                                </span>
                                <span className="text-sm leading-normal text-ink-3">{t(`layouts.${tpl.layout}.desc`)}</span>
                                <span className="flex flex-wrap gap-1.5">
                                    {t(`layouts.${tpl.layout}.chips`)
                                        .split('|')
                                        .map((c) => (
                                            <span key={c} className="inline-flex h-6 items-center rounded-md bg-fill-2 px-2 text-xs font-medium text-ink-2">
                                                {c}
                                            </span>
                                        ))}
                                </span>
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
