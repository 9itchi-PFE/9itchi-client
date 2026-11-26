'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useTranslations } from 'next-intl'
import { CompanyBadge } from '@/components/jobs/OfferCard'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field, TextArea, inputClass } from '@/components/ui/Field'
import { Drawer, Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { useToast } from '@/components/ui/Toast'
import { useEditReview, useImportPost, useReviewAction, useReviewJob, useReviewList } from '@/hooks/useAdminJobs'
import { cn } from '@/lib/cn'
import type { JobEdit, Origin, ReviewItem, ReviewJob, ReviewTab } from '@/types/job'
import { TOPICS, type WorkMode } from '@/types/preferences'
import LogoField from './LogoField'
import { apiError, WhenText } from './SourcesScreen'
import { checks, number, places, status, toEdit, when, type Status } from './collect'

const badge: Record<Status, string> = {
    pending: 'bg-violet-soft text-violet-hover',
    published: 'bg-ok-bg text-ok-fg',
    hidden: 'bg-[#FEE4E2] text-[#B42318]',
    expired: 'bg-fill text-ink-3',
}
const statusKey = { pending: 'statusPending', published: 'statusPublished', hidden: 'statusHidden', expired: 'statusExpired' } as const

function StatusBadge({ value }: { value: Status }) {
    const t = useTranslations('admin')
    return (
        <span className={cn('inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold', badge[value])}>{t(statusKey[value])}</span>
    )
}

function useOrigin() {
    const t = useTranslations('admin')
    return (origin: Origin, sourceUrl?: string) => {
        if (origin === 'site') return t('originSite')
        if (origin === 'book') return t('originBook')
        if (origin === 'feed') return t('originFeed')
        return t('originLink') + (sourceUrl && /linkedin\.com|lnkd\.in/i.test(sourceUrl) ? ' · LinkedIn' : '')
    }
}

function Row({ item, on, onPick }: { item: ReviewItem; on: boolean; onPick: () => void }) {
    const origin = useOrigin()
    return (
        <button
            type="button"
            aria-current={on ? 'true' : undefined}
            onClick={onPick}
            className={cn(
                'flex w-full cursor-pointer items-center gap-3.5 border-0 border-b border-line-soft px-4 py-3.5 text-start last:border-b-0',
                on ? 'bg-violet-tint shadow-[inset_3px_0_0_#4B32E0] rtl:shadow-[inset_-3px_0_0_#4B32E0]' : 'bg-white hover:bg-fill-3',
            )}
        >
            <CompanyBadge company={item.company} size={40} className="flex-none" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold leading-[1.35] text-ink">{item.title}</span>
                <span className="text-[13.5px] text-ink-3">
                    {item.company} · {origin(item.origin)}
                </span>
            </span>
            <StatusBadge value={status(item)} />
        </button>
    )
}

function CheckLine({ ok, children }: { ok: boolean; children: string }) {
    return (
        <li className="flex items-center gap-3 text-[15px]">
            <span
                aria-hidden
                className={cn(
                    'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold',
                    ok ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg',
                )}
            >
                {ok ? '✓' : '!'}
            </span>
            {children}
        </li>
    )
}

function Detail({ job, onEdit }: { job: ReviewJob; onEdit: () => void }) {
    const t = useTranslations('admin')
    const o = useTranslations('offers')
    const toast = useToast()
    const act = useReviewAction()
    const origin = useOrigin()
    const st = status(job)
    const place = job.location || (job.work_mode === 'remote' ? o('remote') : '')
    const pay = job.stipend_tnd === null ? '' : job.stipend_tnd > 0 ? o('perMonth', { amount: job.stipend_tnd }) : o('unpaid')
    const run = (action: 'publish' | 'hide') =>
        act.mutate(
            { id: job.id, action },
            { onSuccess: () => toast(t(action === 'publish' ? 'published' : 'hidden')), onError: (e) => toast(apiError(e) ?? t('stateError')) },
        )
    return (
        <article aria-labelledby="review-title" className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-6 shadow-card">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-ink-3">
                {t('proposed', { origin: origin(job.origin, job.source_url) })} <WhenText value={when(job.created_at)} />
            </span>
            <div className="flex flex-col gap-1.5">
                <h2 id="review-title" className="m-0 font-display text-[26px] font-extrabold leading-[1.15] tracking-tightish">
                    {job.title}
                </h2>
                <p className="m-0 text-[15px] text-ink-3">{[job.company, place, pay].filter(Boolean).join(' · ')}</p>
            </div>
            <LogoField company={job.company} />
            <div>
                <StatusBadge value={st} />
            </div>
            <section className="flex flex-col gap-3">
                <h3 className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-ink-3">{t('checks')}</h3>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {checks(job).map((c) => (
                        <CheckLine key={c.key} ok={c.ok}>
                            {t(c.key as 'checkCompany')}
                        </CheckLine>
                    ))}
                </ul>
            </section>
            {job.description ? (
                <details className="rounded-xl bg-fill-3 px-4 py-3 text-sm leading-[1.6] text-ink-2">
                    <summary className="cursor-pointer font-semibold text-ink">{t('eDescription')}</summary>
                    <p dir="auto" className="mb-0 mt-2 whitespace-pre-line">
                        {job.description}
                    </p>
                    {job.skills.length ? <p className="mb-0 mt-2 text-ink-3">{job.skills.join(' · ')}</p> : null}
                </details>
            ) : null}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button onClick={() => run('publish')} disabled={act.isPending || job.review_status === 'published'}>
                    {job.review_status === 'published' ? t('approved') : t('approve')}
                </Button>
                <Button variant="secondary" onClick={onEdit}>
                    {t('edit')}
                </Button>
                <Button
                    variant="secondary"
                    className="border-[#FDA29B] text-[#B42318] hover:bg-[#FEF3F2]"
                    onClick={() => run('hide')}
                    disabled={act.isPending || job.review_status === 'hidden'}
                >
                    {t('hide')}
                </Button>
                {job.source_url ? (
                    <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 text-[15px] font-semibold text-violet no-underline hover:text-violet-hover"
                    >
                        {t('seeOriginal')}
                    </a>
                ) : null}
            </div>
        </article>
    )
}

// EditDrawer is « Modifier » for one offer; the check screen of a PFE book opens it on a topic.
export function EditDrawer({ job, onClose }: { job: ReviewJob; onClose: () => void }) {
    const t = useTranslations('admin')
    const p = useTranslations('prefs')
    const toast = useToast()
    const edit = useEditReview()
    const [error, setError] = useState('')
    const v = toEdit(job)
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const s = (k: string) => String(f.get(k) ?? '').trim()
        const next: JobEdit = {
            title: s('title'),
            company: s('company'),
            location: s('location'),
            description: s('description'),
            stipend_tnd: number(s('stipend_tnd')),
            duration_months: number(s('duration_months')),
            work_mode: s('work_mode') as WorkMode | '',
            starts_on: s('starts_on'),
            closes_on: s('closes_on'),
            skills: places(s('skills')).slice(0, 30),
            pair_ok: f.get('pair_ok') === 'on',
            topic: s('topic') as JobEdit['topic'],
            apply_email: s('apply_email'),
        }
        setError('')
        edit.mutate(
            { id: job.id, edit: next },
            {
                onSuccess: () => {
                    toast(t('editSaved'))
                    onClose()
                },
                onError: (err) => setError(apiError(err) ?? t('stateError')),
            },
        )
    }
    const select = (name: string, value: string, options: [string, string][]) => (
        <select name={name} defaultValue={value} className={inputClass}>
            <option value="">{t('none')}</option>
            {options.map(([k, label]) => (
                <option key={k} value={k}>
                    {label}
                </option>
            ))}
        </select>
    )
    const label = 'flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2'
    return (
        <Drawer open onClose={onClose} title={t('editTitle')}>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <Field name="title" label={t('eTitle')} required maxLength={300} defaultValue={v.title} />
                <div className="grid grid-cols-2 gap-3">
                    <Field name="company" label={t('eCompany')} required maxLength={200} defaultValue={v.company} />
                    <Field name="location" label={t('eLocation')} maxLength={200} defaultValue={v.location} />
                </div>
                <label className={label}>
                    {t('eDescription')}
                    <TextArea name="description" rows={8} defaultValue={v.description} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <Field name="stipend_tnd" type="number" min={0} max={100000} label={t('eStipend')} defaultValue={v.stipend_tnd ?? ''} />
                    <Field name="duration_months" type="number" min={1} max={12} label={t('eDuration')} defaultValue={v.duration_months ?? ''} />
                    <Field name="starts_on" type="date" label={t('eStart')} defaultValue={v.starts_on} />
                    <Field name="closes_on" type="date" label={t('eCloses')} defaultValue={v.closes_on} />
                    <label className={label}>
                        {t('eMode')}
                        {select('work_mode', v.work_mode, [
                            ['on_site', p('modes.on_site')],
                            ['hybrid', p('modes.hybrid')],
                            ['remote', p('modes.remote')],
                        ])}
                    </label>
                    <label className={label}>
                        {t('eTopic')}
                        {select(
                            'topic',
                            v.topic,
                            TOPICS.map((k) => [k, p(`topics.${k}`)]),
                        )}
                    </label>
                </div>
                <Field name="skills" label={t('eSkills')} defaultValue={v.skills.join(', ')} />
                <Field name="apply_email" type="email" dir="ltr" label={t('eEmail')} defaultValue={v.apply_email} />
                <label className="flex items-center gap-2 text-sm font-medium text-ink-2">
                    <input type="checkbox" name="pair_ok" defaultChecked={v.pair_ok} className="h-4 w-4 accent-ink" />
                    {t('ePair')}
                </label>
                {error ? (
                    <p role="alert" className="m-0 text-sm text-[#B42318]">
                        {error}
                    </p>
                ) : null}
                <Button type="submit" disabled={edit.isPending} className="self-start">
                    {t('save')}
                </Button>
            </form>
        </Drawer>
    )
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const imp = useImportPost()
    const [error, setError] = useState('')
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        setError('')
        imp.mutate(
            { url: String(f.get('url')).trim(), text: String(f.get('text')).trim(), company: String(f.get('company')).trim() || undefined },
            {
                onSuccess: (j) => {
                    toast(t('imported'))
                    onDone(j.id)
                },
                onError: (err) => setError(isAxiosError(err) && err.response?.status === 503 ? t('aiDown') : (apiError(err) ?? t('stateError'))),
            },
        )
    }
    return (
        <Modal open onClose={onClose} title={t('importTitle')} width={600}>
            <p className="m-0 text-[15px] leading-[1.55] text-ink-3">{t('importIntro')}</p>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <Field name="url" type="url" dir="ltr" required maxLength={2048} label={t('iUrl')} placeholder="https://www.linkedin.com/posts/…" />
                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                    {t('iText')}
                    <TextArea name="text" rows={9} required maxLength={40000} />
                </label>
                <Field name="company" maxLength={200} label={t('iCompany')} />
                {error ? (
                    <p role="alert" className="m-0 text-sm text-[#B42318]">
                        {error}
                    </p>
                ) : null}
                <Button type="submit" disabled={imp.isPending} className="self-end">
                    {t('iSubmit')}
                </Button>
            </form>
        </Modal>
    )
}

// ReviewScreen is « Offres » of the admin: nothing reaches students before it is approved here.
export default function ReviewScreen() {
    const t = useTranslations('admin')
    const [tab, setTab] = useState<ReviewTab>('pending')
    const [picked, setPicked] = useState<string>()
    const [editing, setEditing] = useState(false)
    const [importing, setImporting] = useState(false)
    const list = useReviewList(tab)
    const items = list.data?.items ?? []
    const counts = list.data?.counts
    // The picked offer stays shown after an action moves it to another queue; otherwise the first of the queue.
    const id = picked ?? items[0]?.id
    const job = useReviewJob(id)
    useEffect(() => setEditing(false), [id])
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="m-0 font-display text-[44px] font-extrabold leading-[1.05] tracking-tightish">{t('offersTitle')}</h1>
                    <p className="m-0 text-base text-ink-3">{t('offersSubtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <ButtonLink href="/admin/books" variant="secondary" size="lg">
                        {t('importBook')}
                    </ButtonLink>
                    <Button size="lg" onClick={() => setImporting(true)}>
                        {t('importPost')}
                    </Button>
                </div>
            </div>
            <Segmented
                label={t('tabs')}
                value={tab}
                onChange={(v) => {
                    setTab(v)
                    setPicked(undefined)
                }}
                className="self-start"
                itemClassName="px-4 h-10 text-[15px]"
                options={[
                    { value: 'pending', label: t('tabPending', { count: counts?.pending ?? 0 }) },
                    { value: 'expired', label: t('tabExpired', { count: counts?.expired ?? 0 }) },
                    { value: 'hidden', label: t('tabHidden', { count: counts?.hidden ?? 0 }) },
                ]}
            />
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                <div className="overflow-hidden rounded-[18px] border border-line bg-white">
                    {list.isLoading ? <div className="sk m-4 h-14 rounded-lg" /> : null}
                    {list.data && items.length === 0 ? <p className="m-0 px-5 py-8 text-[15px] text-ink-3">{t('emptyQueue')}</p> : null}
                    {items.map((it) => (
                        <Row key={it.id} item={it} on={it.id === id} onPick={() => setPicked(it.id)} />
                    ))}
                </div>
                {job.data ? <Detail job={job.data} onEdit={() => setEditing(true)} /> : id ? <div className="sk h-[420px] rounded-[22px]" /> : null}
            </div>
            {editing && job.data ? <EditDrawer job={job.data} onClose={() => setEditing(false)} /> : null}
            {importing ? (
                <ImportModal
                    onClose={() => setImporting(false)}
                    onDone={(newId) => {
                        setImporting(false)
                        setTab('pending')
                        setPicked(newId)
                    }}
                />
            ) : null}
        </div>
    )
}
