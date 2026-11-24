'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import { useMySubscription } from '@/hooks/usePlans'
import { resumeKeys, useAtsCheck, useDownloads, usePhoto, useResume, useResumes, useSaveVersion } from '@/hooks/useResumes'
import { useTemplates } from '@/hooks/useTemplates'
import { cn } from '@/lib/cn'
import ShowSwitch from './ShowSwitch'
import { errorStatus } from '@/services/ApiService'
import ResumeService from '@/services/ResumeService'
import { normalize, sectionOrder, type Resume, type ResumeContent } from '@/types/resume'
import CvPreview, { type SectionKey } from '../CvPreview'
import StylePanel from './StylePanel'
import { phonePlaceholder } from '../cvText'
import DownloadDialogs, { type DownloadMode } from './DownloadDialogs'
import PhotoControl from './PhotoControl'
import ScoreBanner from './ScoreBanner'
import {
    CertificationsEditor,
    ContactEditor,
    EducationEditor,
    ExperienceEditor,
    ExtraEditor,
    LanguagesEditor,
    ProjectsEditor,
    SkillsEditor,
    SummaryEditor,
    sectionTitle,
} from './SectionEditors'
import { sectionsToFix, type Section } from './sections'
import VersionsDrawer from './VersionsDrawer'

const SAVE_DELAY = 800
const EXTRA_KINDS = ['clubs', 'awards', 'volunteering', 'interests'] as const

type SaveState = 'saved' | 'saving' | 'failed'

export default function CvEditor({ id }: { id: string }) {
    const t = useTranslations('cv')
    const tc = useTranslations('common')
    const query = useResume(id)
    if (query.isError) {
        return <p className="mx-auto max-w-[1320px] px-8 py-16 text-ink-3">{errorStatus(query.error) === 404 ? t('notFound') : tc('error')}</p>
    }
    if (!query.data) return <p className="mx-auto max-w-[1320px] px-8 py-16 text-ink-3">{tc('loading')}</p>
    return <Editor key={query.data.id} resume={query.data} />
}

function Editor({ resume: initial }: { resume: Resume }) {
    const t = useTranslations('cv')
    const tl = useTranslations('templates.layouts')
    const format = useFormatter()
    const toast = useToast()
    const qc = useQueryClient()
    const params = useSearchParams()
    const id = initial.id

    const [resume, setResume] = useState(initial)
    const [content, setContent] = useState<ResumeContent>(() => normalize(initial.content))
    const [section, setSection] = useState<Section>((params.get('section') as Section) || 'experience')
    const [item, setItem] = useState(Number(params.get('item') ?? -1))
    const [expanded, setExpanded] = useState(true)
    const focusLine = params.get('line') ? Number(params.get('line')) : undefined
    const [save, setSave] = useState<SaveState>('saved')
    const [savedAt, setSavedAt] = useState<Date | null>(null)
    const [now, setNow] = useState(() => new Date())
    const [download, setDownload] = useState<DownloadMode>('')
    const [versionsOpen, setVersionsOpen] = useState(false)
    const [adding, setAdding] = useState(false)
    const [pages, setPages] = useState(1)

    const templates = useTemplates().data
    const layout = templates?.find((x) => x.id === resume.template_id)?.layout ?? 'classic'
    const templateName = tl(`${layout}.name`)
    const sub = useMySubscription().data
    const isSubscriber = sub ? !sub.is_free : false
    const downloads = useDownloads().data
    const resumes = useResumes().data
    const photo = usePhoto(id, resume.has_photo).data
    const check = useAtsCheck(id)
    const snapshot = useSaveVersion(id)
    const toFix = useMemo(() => sectionsToFix(check.data?.rules), [check.data])

    // Autosave: the content goes to resume-api SAVE_DELAY after the last keystroke.
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const dirtySince = useRef<Section | null>(null)
    const latest = useRef(content)
    const persist = useCallback(
        async (c: ResumeContent) => {
            setSave('saving')
            try {
                const { data } = await ResumeService.updateResume(id, { content: c })
                if (latest.current === c) {
                    setSave('saved')
                    setSavedAt(new Date())
                }
                setResume((r) => ({ ...r, updated_at: data.updated_at, title: data.title }))
                qc.setQueryData(resumeKeys.one(id), { ...data, content: c })
                qc.invalidateQueries({ queryKey: resumeKeys.check(id) })
            } catch {
                setSave('failed')
            }
        },
        [id, qc],
    )
    const change = (c: ResumeContent) => {
        setContent(c)
        latest.current = c
        dirtySince.current = section
        setSave('saving')
        clearTimeout(timer.current)
        timer.current = setTimeout(() => persist(c), SAVE_DELAY)
    }
    useEffect(() => () => clearTimeout(timer.current), [])
    useEffect(() => {
        const i = setInterval(() => setNow(new Date()), 30000)
        return () => clearInterval(i)
    }, [])
    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (save === 'saving') e.preventDefault()
        }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [save])

    // Leaving a section that was edited keeps a version of the CV in the history tab.
    const go = (s: Section, i = -1) => {
        if (dirtySince.current && dirtySince.current !== s) {
            const prev = dirtySince.current
            dirtySince.current = null
            snapshot.mutate(prev.startsWith('extra:') ? 'edited_extra' : `edited_${prev}`)
        }
        // A second click on the open section folds it.
        setExpanded(s !== section || !expanded)
        setSection(s)
        setItem(i)
    }

    const status =
        save === 'saving'
            ? t('saving')
            : save === 'failed'
              ? t('saveFailed')
              : !savedAt || now.getTime() - savedAt.getTime() < 60000
                ? t('savedNow')
                : t('savedAt', { time: format.dateTime(savedAt, { hour: '2-digit', minute: '2-digit' }) })

    const openDownload = () => {
        if (isSubscriber) setDownload('sub')
        else setDownload((downloads?.used ?? 0) >= 1 ? 'pay' : 'free')
    }

    const addExtra = (kind: (typeof EXTRA_KINDS)[number]) => {
        const extra = [...(content.extra ?? []), { title: t(`extraKinds.${kind}`), items: [''] }]
        change({ ...content, extra })
        snapshot.mutate('section_added')
        setAdding(false)
        setExpanded(true)
        setSection(`extra:${extra.length - 1}`)
        toast(t('toastExtraAdded'))
    }

    const order = sectionOrder(content)
    const navItems: Section[] = ['contact', ...(order as Section[])]
    const [dragKey, setDragKey] = useState<Section | null>(null)
    const [tab, setTab] = useState<'content' | 'customize'>('content')
    const hiddenSet = new Set(content.hidden_sections ?? [])
    const toggleHidden = (key: Section) => {
        const next = hiddenSet.has(key) ? (content.hidden_sections ?? []).filter((k) => k !== key) : [...(content.hidden_sections ?? []), key]
        change({ ...content, hidden_sections: next.length ? next : undefined })
    }
    const move = (key: Section, to: number) => {
        const from = order.indexOf(key)
        if (from < 0 || to < 0 || to >= order.length || to === from) return
        const next = [...order]
        next.splice(from, 1)
        next.splice(to, 0, key)
        change({ ...content, section_order: next })
    }
    const highlight: SectionKey = section.startsWith('extra:') ? 'extra' : (section as SectionKey)
    const props = { content, onChange: change, language: resume.language, item, setItem, focusLine }

    const editor = (() => {
        switch (section) {
            case 'contact':
                return (
                    <ContactEditor
                        {...props}
                        photo={
                            <div className="flex flex-col gap-3">
                            <PhotoControl
                                resumeId={id}
                                hasPhoto={resume.has_photo}
                                photoUrl={photo}
                                shown={content.style?.show_photo !== false}
                                onShown={(on) => {
                                    const { show_photo: _drop, ...rest } = content.style ?? {}
                                    const style = on ? rest : { ...rest, show_photo: false }
                                    change({ ...content, style: Object.keys(style).length ? style : undefined })
                                }}
                                onChanged={(has) => {
                                    setResume((r) => ({ ...r, has_photo: has }))
                                    qc.invalidateQueries({ queryKey: resumeKeys.photo(id) })
                                }}
                            />
                            </div>
                        }
                    />
                )
            case 'summary':
                return <SummaryEditor {...props} />
            case 'education':
                return <EducationEditor {...props} />
            case 'projects':
                return <ProjectsEditor {...props} />
            case 'skills':
                return <SkillsEditor {...props} />
            case 'certifications':
                return <CertificationsEditor {...props} />
            case 'languages':
                return <LanguagesEditor {...props} />
            case 'experience':
                return <ExperienceEditor {...props} />
            default:
                return <ExtraEditor {...props} index={Number(section.slice(6))} />
        }
    })()

    const cvLang = resume.language === 'en' ? 'en' : 'fr'

    return (
        <div className="mx-auto box-border flex w-full max-w-[1500px] flex-col gap-[22px] px-8 pb-[72px] pt-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                    <h1 className="m-0 text-[44px] font-extrabold leading-[1.05]">{t('title')}</h1>
                    <p className="m-0 text-[15px] text-ink-3" aria-live="polite">
                        {t('subtitle', { status })}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" className="px-3.5 font-medium" onClick={() => setVersionsOpen(true)}>
                        <Icon name="history" />
                        {t('versions', { count: isSubscriber ? (resumes?.total ?? 1) : 1 })}
                    </Button>
                    <Link
                        href={`/resumes/templates?cv=${id}`}
                        className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-line-strong bg-white px-3.5 text-sm font-medium text-ink no-underline hover:text-ink"
                        aria-label={t('template', { name: templateName })}
                    >
                        <span
                            className={cn(
                                'box-border h-[18px] w-3.5 rounded-sm border-[1.5px]',
                                layout === 'compact' ? 'border-ink' : 'border-cv-blue',
                                layout === 'modern' && 'bg-cv-navy',
                            )}
                        />
                        {templateName}
                        <Icon name="chevron" size={15} />
                    </Link>
                    <Segmented
                        role="radiogroup"
                        label={t('cvLanguage')}
                        value={cvLang}
                        onChange={() => toast(t('translateSoon'))}
                        options={[
                            { value: 'fr', label: 'FR', disabled: cvLang !== 'fr', title: cvLang !== 'fr' ? t('translateSoon') : undefined },
                            { value: 'en', label: 'EN', disabled: cvLang !== 'en', title: cvLang !== 'en' ? t('translateSoon') : undefined },
                        ]}
                    />
                    <Button onClick={openDownload}>
                        <Icon name="download" stroke="#D6F25E" />
                        {t('download')}
                    </Button>
                </div>
            </div>

            <div role="tablist" aria-label={t('tabs.label')} className="flex gap-1 self-start rounded-xl bg-fill-3 p-1">
                {(['content', 'customize'] as const).map((k) => (
                    <button
                        key={k}
                        type="button"
                        role="tab"
                        aria-selected={tab === k}
                        onClick={() => setTab(k)}
                        className={cn(
                            'h-10 cursor-pointer rounded-[9px] border-0 px-5 text-[14.5px] font-semibold',
                            tab === k ? 'bg-white text-ink shadow-sm' : 'bg-transparent text-ink-3 hover:text-ink',
                        )}
                    >
                        {t(`tabs.${k}`)}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3 lg:max-w-[460px]">
                    {tab === 'customize' ? (
                        <div className="rounded-[14px] border border-line-soft bg-white p-4">
                            <StylePanel style={content.style} layout={layout} onChange={(style) => change({ ...content, style })} />
                        </div>
                    ) : (
                        <>
                            <ScoreBanner resumeId={id} check={check.data} />
                            <nav aria-label={t('sectionsNav')} className="flex flex-col gap-2">
                                {navItems.map((s) => {
                                    const on = s === section && expanded
                                    const pinned = s === 'contact'
                                    const idx = order.indexOf(s)
                                    const hidden = hiddenSet.has(s)
                                    return (
                                        <div
                                            key={s}
                                            draggable={!pinned}
                                            onDragStart={(e) => {
                                                if (pinned) return
                                                e.dataTransfer.effectAllowed = 'move'
                                                e.dataTransfer.setData('text/plain', s)
                                                setDragKey(s)
                                            }}
                                            onDragOver={(e) => {
                                                if (dragKey && !pinned) e.preventDefault()
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                if (dragKey && !pinned) move(dragKey, idx)
                                                setDragKey(null)
                                            }}
                                            onDragEnd={() => setDragKey(null)}
                                            className={cn('rounded-[14px] border bg-white', on ? 'border-violet' : 'border-line-soft', dragKey === s && 'opacity-40')}
                                        >
                                            <div className="flex h-14 items-center gap-1.5 px-2.5">
                                                <span aria-hidden className={cn('w-5 flex-none text-center text-ink-3', pinned ? 'invisible' : 'cursor-grab')}>
                                                    ⋮⋮
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-expanded={on}
                                                    aria-keyshortcuts={pinned ? undefined : 'Alt+ArrowUp Alt+ArrowDown'}
                                                    onKeyDown={(e) => {
                                                        if (pinned || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
                                                        e.preventDefault()
                                                        move(s, idx + (e.key === 'ArrowUp' ? -1 : 1))
                                                    }}
                                                    onClick={() => go(s)}
                                                    className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-start text-[15px] font-semibold text-ink"
                                                >
                                                    <span className={cn('h-2 w-2 flex-none rounded-full', toFix.has(s) ? 'bg-warn-dot' : 'bg-ok-dot')} />
                                                    <span className={cn('min-w-0 flex-1 truncate', hidden && 'text-ink-3 line-through')}>{sectionTitle(s, content, t)}</span>
                                                </button>
                                                {pinned ? null : (
                                                    <ShowSwitch shown={!hidden} label={hidden ? t('showSection') : t('hideSection')} onChange={() => toggleHidden(s)} />
                                                )}
                                                <span aria-hidden className="w-4 flex-none text-center text-ink-3">
                                                    {on ? '▴' : '▾'}
                                                </span>
                                            </div>
                                            {on ? <div className="border-t border-line-soft p-3">{editor}</div> : null}
                                        </div>
                                    )
                                })}
                                <button
                                    type="button"
                                    onClick={() => setAdding(true)}
                                    className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] border border-dashed border-violet bg-transparent text-[14.5px] font-semibold text-violet hover:bg-violet-tint"
                                >
                                    {t('addSection')}
                                </button>
                            </nav>
                        </>
                    )}
                </div>

                <section aria-label={t('previewAria')} className="sticky top-4 flex min-w-0 flex-[3_1_560px] flex-col items-center gap-2.5 rounded-[18px] bg-fill-3 p-5">
                    <div className="flex w-full items-center justify-between text-[13px] text-ink-3">
                        <span>{t('previewLabel', { pages })}</span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm border-[1.5px] border-violet" />
                            {t('previewCurrent')}
                        </span>
                    </div>
                    <div className="w-full max-w-[760px]">
                        <CvPreview
                            content={content}
                            layout={layout}
                            language={cvLang}
                            photoUrl={photo}
                            highlight={highlight}
                            phonePlaceholder={phonePlaceholder[cvLang]}
                            onPages={setPages}
                            ariaLabel={t('previewAria')}
                        />
                    </div>
                </section>
            </div>

            <DownloadDialogs mode={download} setMode={setDownload} resume={{ ...resume, content }} templateName={templateName} />
            <VersionsDrawer
                open={versionsOpen}
                onClose={() => setVersionsOpen(false)}
                resume={resume}
                isSubscriber={isSubscriber}
                onRestored={(r) => {
                    setResume(r)
                    const c = normalize(r.content)
                    setContent(c)
                    latest.current = c
                }}
            />
            <Modal open={adding} onClose={() => setAdding(false)} title={t('addSectionTitle')}>
                <p className="m-0 text-[15px] text-ink-3">{t('addSectionText')}</p>
                <div className="grid grid-cols-2 gap-2">
                    {EXTRA_KINDS.map((k) => (
                        <Button key={k} variant="secondary" className="h-12 justify-start font-medium" onClick={() => addExtra(k)}>
                            {t(`extraKinds.${k}`)}
                        </Button>
                    ))}
                </div>
            </Modal>
        </div>
    )
}
