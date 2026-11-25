'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { Drawer } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import { resumeKeys, useChooseEditable, useResumes, useVersions } from '@/hooks/useResumes'
import { useTemplates } from '@/hooks/useTemplates'
import { cn } from '@/lib/cn'
import { errorStatus } from '@/services/ApiService'
import ResumeService from '@/services/ResumeService'
import type { Resume } from '@/types/resume'

const knownLabels = [
    'bullet_rewritten',
    'template_changed',
    'section_added',
    'before_restore',
    'photo_changed',
    'edited_contact',
    'edited_summary',
    'edited_education',
    'edited_experience',
    'edited_projects',
    'edited_skills',
    'edited_certifications',
    'edited_languages',
    'edited_extra',
    'manual',
]

// VersionsDrawer is the side panel of screen 4.1. "Mes versions" are the student's CVs (one per kind of job,
// for subscribers); "Historique" is the saved states of the open CV, each one restorable.
export default function VersionsDrawer({
    open,
    onClose,
    resume,
    isSubscriber,
    onRestored,
}: {
    open: boolean
    onClose: () => void
    resume: Resume
    isSubscriber: boolean
    onRestored: (r: Resume) => void
}) {
    const t = useTranslations('versions')
    const tc = useTranslations('common')
    const tl = useTranslations('templates.layouts')
    const format = useFormatter()
    const toast = useToast()
    const router = useRouter()
    const qc = useQueryClient()
    const [tab, setTab] = useState<'versions' | 'history'>('versions')
    const [renaming, setRenaming] = useState<string | null>(null)
    const [name, setName] = useState('')
    const resumes = useResumes().data?.items ?? []
    const choose = useChooseEditable()
    const history = useVersions(resume.id, open && tab === 'history').data ?? []
    const templates = useTemplates().data
    const layoutName = (templateId: string | null) => tl(`${templates?.find((x) => x.id === templateId)?.layout ?? 'classic'}.name`)
    const when = (iso: string) => format.relativeTime(new Date(iso), new Date())
    // stamp reads "Aujourd’hui, 17:58", "Hier, 21:10" or "18 nov., 10:02", as in the history tab of the canvas.
    const stamp = (iso: string) => {
        const d = new Date(iso)
        const time = format.dateTime(d, { hour: '2-digit', minute: '2-digit' })
        const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
        const diff = Math.round((day(new Date()) - day(d)) / 86400000)
        if (diff === 0) return t('today', { time })
        if (diff === 1) return t('yesterday', { time })
        return `${format.dateTime(d, { day: 'numeric', month: 'short' })}, ${time}`
    }
    // Every CV is listed: beyond the plan's limit, the others are read-only, never hidden.
    const shown = resumes.length ? resumes : [resume]

    const copy = async (id: string, title: string, message: string) => {
        try {
            const { data } = await ResumeService.duplicateResume(id, title.slice(0, 200))
            await qc.invalidateQueries({ queryKey: resumeKeys.list })
            toast(message)
            return data
        } catch (err) {
            toast(errorStatus(err) === 402 ? t('freeText') : t('freeTitle'))
        }
    }
    const rename = async (id: string) => {
        const title = name.trim()
        setRenaming(null)
        if (!title) return
        await ResumeService.updateResume(id, { title })
        await qc.invalidateQueries({ queryKey: resumeKeys.list })
        qc.invalidateQueries({ queryKey: resumeKeys.one(id) })
        toast(t('toastRenamed'))
    }
    const restore = async (versionId: string, iso: string) => {
        const { data } = await ResumeService.restoreVersion(resume.id, versionId)
        qc.setQueryData(resumeKeys.one(resume.id), data)
        qc.invalidateQueries({ queryKey: resumeKeys.versions(resume.id) })
        onRestored(data)
        onClose()
        toast(t('toastRestored', { when: format.dateTime(new Date(iso), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }))
    }

    return (
        <Drawer open={open} onClose={onClose} title={t('title')}>
            <Segmented
                label={t('tabsLabel')}
                value={tab}
                onChange={setTab}
                itemClassName="flex-1"
                options={[
                    { value: 'versions', label: t('tabVersions') },
                    { value: 'history', label: t('tabHistory') },
                ]}
            />
            {tab === 'versions' ? (
                <div className="flex flex-col gap-2.5">
                    <span className="text-sm leading-normal text-ink-3">{isSubscriber ? t('introSub') : t('introFree')}</span>
                    {shown.map((v) => {
                        const current = v.id === resume.id
                        return (
                            <div
                                key={v.id}
                                className={cn(
                                    'flex flex-col gap-2.5 rounded-[14px] bg-white p-4',
                                    current ? 'border-[1.5px] border-ink' : 'border border-line-soft',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2.5">
                                    {renaming === v.id ? (
                                        <label className="flex flex-1 flex-col gap-1 text-[13px] text-ink-3">
                                            {t('renameLabel')}
                                            <input
                                                autoFocus
                                                className={inputClass}
                                                value={name}
                                                maxLength={200}
                                                onChange={(e) => setName(e.target.value)}
                                                onBlur={() => rename(v.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && rename(v.id)}
                                            />
                                        </label>
                                    ) : (
                                        <span className="flex flex-col gap-[3px]">
                                            <strong className="text-[15px]">{v.title}</strong>
                                            <span className="text-[13px] text-ink-3">
                                                {t('meta', { template: layoutName(v.template_id), when: when(v.updated_at) })}
                                            </span>
                                        </span>
                                    )}
                                    <span className="flex flex-none gap-1.5">
                                        {v.locked ? (
                                            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-fill-3 px-[9px] text-xs font-bold text-ink-2">
                                                <Icon name="lock" size={12} />
                                                {t('locked')}
                                            </span>
                                        ) : null}
                                        {current ? (
                                            <span className="inline-flex h-6 items-center rounded-full bg-lime px-[9px] text-xs font-bold">{t('opened')}</span>
                                        ) : null}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {!current ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-ink-2"
                                            onClick={() => {
                                                onClose()
                                                router.push(`/resumes/${v.id}`)
                                                toast(t('toastOpened', { name: v.title }))
                                            }}
                                        >
                                            {t('open')}
                                        </Button>
                                    ) : null}
                                    {isSubscriber ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-ink-2"
                                            onClick={() => copy(v.id, t('copyOf', { name: v.title }), t('toastCopy'))}
                                        >
                                            {t('duplicate')}
                                        </Button>
                                    ) : null}
                                    {v.locked ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-ink-2"
                                            disabled={choose.isPending}
                                            onClick={() =>
                                                choose.mutate(v.id, {
                                                    onSuccess: () => toast(t('toastChosen', { name: v.title })),
                                                    onError: () => toast(tc('error')),
                                                })
                                            }
                                        >
                                            {t('choose')}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-ink-2"
                                            onClick={() => {
                                                setName(v.title)
                                                setRenaming(v.id)
                                            }}
                                        >
                                            {t('rename')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {isSubscriber ? (
                        <Button
                            variant="dashed"
                            className="h-[46px] text-[14.5px]"
                            onClick={async () => {
                                const r = await copy(resume.id, t('newName', { n: resumes.length + 1 }), t('toastNew'))
                                if (r) {
                                    onClose()
                                    router.push(`/resumes/${r.id}`)
                                }
                            }}
                        >
                            {t('newVersion', { name: resume.title })}
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2.5 rounded-[14px] border border-dashed border-[#C9CDD5] bg-white p-4">
                            <span className="flex items-center gap-2.5">
                                <Icon name="lock" />
                                <strong className="text-[15px]">{t('freeTitle')}</strong>
                            </span>
                            <span className="text-sm leading-normal text-ink-3">{t('freeText')}</span>
                            <Link href="/settings/billing" className="self-start text-sm font-semibold no-underline">
                                {t('freeLink')}
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <span className="mb-1.5 text-sm leading-normal text-ink-3">{t('historyIntro', { name: resume.title })}</span>
                    {history.map((h, i) => (
                        <div key={h.id} className="flex items-start gap-3 border-b border-line-soft py-3">
                            <span className={cn('mt-1.5 h-2 w-2 flex-none rounded-full', i === 0 ? 'bg-violet' : 'bg-ink-4')} />
                            <span className="flex flex-1 flex-col gap-0.5">
                                <strong className="text-[14.5px] font-semibold">{t(`labels.${knownLabels.includes(h.label) ? h.label : 'other'}`)}</strong>
                                <span className="text-[13px] text-ink-3">{stamp(h.created_at)}</span>
                            </span>
                            <Button variant="secondary" size="sm" className="text-ink-2" onClick={() => restore(h.id, h.created_at)}>
                                {t('restore')}
                            </Button>
                        </div>
                    ))}
                    <div className="flex items-start gap-3 border-b border-line-soft py-3">
                        <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-ink-4" />
                        <span className="flex flex-1 flex-col gap-0.5">
                            <strong className="text-[14.5px] font-semibold">{t('created')}</strong>
                            <span className="text-[13px] text-ink-3">{stamp(resume.created_at)}</span>
                        </span>
                    </div>
                </div>
            )}
        </Drawer>
    )
}
