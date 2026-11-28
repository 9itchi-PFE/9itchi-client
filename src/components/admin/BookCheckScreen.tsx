'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field, TextArea, inputClass } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { Select } from '@/components/ui/Select'
import { useAdminBook, useBookPdf, useDeleteBook, useEditBook, usePublishBook, useRetryBook } from '@/hooks/useAdminBooks'
import { useReviewJob } from '@/hooks/useAdminJobs'
import { cn } from '@/lib/cn'
import type { AdminBook, BookTopic } from '@/types/job'
import { TOPICS, type Topic } from '@/types/preferences'
import { BookPill, FileLine } from './BooksScreen'
import LogoField from './LogoField'
import { EditDrawer } from './ReviewScreen'
import { apiError } from './SourcesScreen'
import { bookInput, canPublish, defaultPicked, tally, topicState, type TopicState } from './books'

const statePill: Record<TopicState, string> = {
    ready: 'bg-ok-bg text-ok-fg',
    check: 'bg-warn-bg text-warn-fg',
    published: 'bg-violet-soft text-violet-hover',
    hidden: 'bg-fill text-ink-3',
}
const stateKey = { ready: 'topicReady', check: 'topicCheck', published: 'statusPublished', hidden: 'statusHidden' } as const
const errorKey = {
    ai_unavailable: 'bookErrAi',
    no_topics: 'bookErrNoTopics',
    storage_error: 'bookErrStorage',
    already_known: 'bookErrKnown',
    partial: 'bookErrPartial',
} as const

// Steps shows where the book stands: imported, being checked, published.
function Steps({ book }: { book: AdminBook }) {
    const t = useTranslations('admin')
    const at = book.status === 'published' ? 3 : book.status === 'draft' ? 2 : 1
    const steps = [t('stepImport'), t('stepCheck'), t('stepPublish')]
    return (
        <ol aria-label={t('steps')} className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 text-[14px] font-semibold">
            {steps.map((label, i) => {
                const n = i + 1
                const done = n < at || book.status === 'published'
                const current = n === at && !done
                return (
                    <li
                        key={label}
                        aria-current={current ? 'step' : undefined}
                        className={cn('flex items-center gap-2', done || current ? 'text-ink' : 'text-ink-3')}
                    >
                        <span
                            aria-hidden
                            className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                done ? 'bg-ok-bg text-ok-fg' : current ? 'bg-ink text-white' : 'bg-fill text-ink-3',
                            )}
                        >
                            {done ? '✓' : n}
                        </span>
                        {label}
                    </li>
                )
            })}
        </ol>
    )
}

function FileCard({ book }: { book: AdminBook }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const [wanted, setWanted] = useState(false)
    const pdf = useBookPdf(book.id, wanted && !!book.has_pdf, true)
    // The PDF is read with the session, then opened in a new tab once it is here.
    useEffect(() => {
        if (!wanted) return
        if (pdf.url) {
            window.open(pdf.url, '_blank', 'noopener')
            setWanted(false)
        } else if (pdf.isError) {
            toast(t('pdfOpenError'))
            setWanted(false)
        }
    }, [wanted, pdf.url, pdf.isError, toast, t])
    return (
        <div className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-4 py-3">
            <span
                aria-hidden
                className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-fill font-mono text-[11px] font-bold text-ink-3"
            >
                PDF
            </span>
            <span className="flex min-w-0 flex-col">
                <strong className="truncate text-[14.5px]" dir="ltr" title={book.file_name ?? undefined}>
                    {book.file_name ?? t('bookNoFile')}
                </strong>
                <span className="text-[13px] text-ink-3">
                    <FileLine book={book} />
                </span>
            </span>
            {book.has_pdf ? (
                <Button variant="secondary" size="sm" className="ms-auto" disabled={wanted} onClick={() => setWanted(true)}>
                    {t('bookSeePdf')}
                </Button>
            ) : null}
        </div>
    )
}

function CommonForm({ book }: { book: AdminBook }) {
    const t = useTranslations('admin')
    const p = useTranslations('prefs')
    const toast = useToast()
    const edit = useEditBook(book.id)
    const [error, setError] = useState('')
    const c = book.common
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        edit.mutate(bookInput(new FormData(e.currentTarget), book.year), {
            onSuccess: () => toast(t('bookSaved')),
            onError: (err) => setError(apiError(err) ?? t('stateError')),
        })
    }
    const label = 'flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2'
    return (
        <section aria-labelledby="common-h" className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
            <div className="flex flex-col gap-1">
                <h2 id="common-h" className="m-0 text-xl font-extrabold">
                    {t('bookCommon')}
                </h2>
                <span className="text-[14.5px] text-ink-3">{t('bookCommonHint')}</span>
            </div>
            <LogoField company={book.company} />
            {/* The key puts the stored values back in the fields after a save or a new reading. */}
            <form key={`${book.company}|${book.title}|${book.year}|${JSON.stringify(c)}`} onSubmit={submit} className="flex flex-col gap-3.5">
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field name="company" label={t('eCompany')} required maxLength={200} defaultValue={book.company} />
                    <Field name="title" label={t('bookTitleField')} required maxLength={200} defaultValue={book.title} />
                    <Field name="sector" label={t('bookSector')} maxLength={80} defaultValue={book.sector ?? ''} />
                    <Field name="year" type="number" min={2020} max={2100} required label={t('bookYear')} defaultValue={book.year} />
                    <Field name="starts_on" type="date" label={t('eStart')} defaultValue={c?.starts_on ?? ''} />
                    <Field name="duration_months" type="number" min={1} max={12} label={t('eDuration')} defaultValue={c?.duration_months ?? ''} />
                    <Field name="stipend_tnd" type="number" min={0} max={100000} label={t('eStipend')} defaultValue={c?.stipend_tnd ?? ''} />
                    <Field name="city" label={t('bookCity')} maxLength={80} defaultValue={book.city ?? ''} />
                    <Field name="location" label={t('bookTopicsPlace')} maxLength={200} defaultValue={c?.location ?? ''} />
                    <label className={label}>
                        {t('eMode')}
                        <Select name="work_mode" defaultValue={c?.work_mode ?? ''} className={inputClass}>
                            <option value="">{t('bookKeep')}</option>
                            <option value="on_site">{p('modes.on_site')}</option>
                            <option value="hybrid">{p('modes.hybrid')}</option>
                            <option value="remote">{p('modes.remote')}</option>
                        </Select>
                    </label>
                    <Field name="closes_on" type="date" label={t('eCloses')} defaultValue={c?.closes_on ?? ''} />
                </div>
                <label className={label}>
                    {t('bookSummary')}
                    <TextArea name="summary" rows={2} maxLength={1000} defaultValue={book.summary} />
                </label>
                {error ? (
                    <p role="alert" className="m-0 text-sm text-[#B42318]">
                        {error}
                    </p>
                ) : null}
                <Button type="submit" variant="secondary" disabled={edit.isPending} className="self-start">
                    {t('bookApply')}
                </Button>
            </form>
        </section>
    )
}

function TopicEditor({ id, onClose }: { id: string; onClose: () => void }) {
    const job = useReviewJob(id)
    return job.data ? <EditDrawer job={job.data} onClose={onClose} /> : null
}

function Topics({ book, picked, onToggle, onEdit }: { book: AdminBook; picked: Set<string>; onToggle: (id: string) => void; onEdit: (id: string) => void }) {
    const t = useTranslations('admin')
    const p = useTranslations('prefs')
    const topics = book.topics ?? []
    const n = tally(topics)
    const th = 'px-3 py-2.5 text-start text-[13px] font-semibold text-ink-3'
    const td = 'border-b border-line-soft px-3 py-3 align-top text-[14.5px]'
    return (
        <section aria-labelledby="topics-h" className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="topics-h" className="m-0 text-xl font-extrabold">
                    {t('bookTopics')}
                </h2>
                <span className="text-[14.5px] text-ink-3">
                    <strong className="text-ink">{t('topicsToCheck', { count: n.check })}</strong> · {t('topicsReady', { count: n.ready })}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table aria-labelledby="topics-h" className="w-full min-w-[860px] border-collapse">
                    <thead>
                        <tr className="bg-fill-3">
                            <th scope="col" className={cn(th, 'w-[64px] rounded-s-[10px]')}>
                                {t('colPublish')}
                            </th>
                            <th scope="col" className={th}>
                                {t('colTopic')}
                            </th>
                            <th scope="col" className={th}>
                                {t('colField')}
                            </th>
                            <th scope="col" className={th}>
                                {t('colSkills')}
                            </th>
                            <th scope="col" className={th}>
                                {t('colPage')}
                            </th>
                            <th scope="col" className={th}>
                                {t('colState')}
                            </th>
                            <th scope="col" className={cn(th, 'rounded-e-[10px]')}>
                                <span className="sr-only">{t('edit')}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {topics.map((topic: BookTopic) => {
                            const state = topicState(topic)
                            const name = topic.ref ? `${topic.ref} ${topic.title}` : topic.title
                            return (
                                <tr key={topic.id}>
                                    <td className={td}>
                                        <input
                                            type="checkbox"
                                            aria-label={t('publishTopic', { topic: name })}
                                            checked={picked.has(topic.id)}
                                            disabled={!canPublish(topic)}
                                            onChange={() => onToggle(topic.id)}
                                            className="h-4 w-4 accent-ink"
                                        />
                                    </td>
                                    <td className={td}>
                                        {topic.ref ? (
                                            <span className="block font-mono text-[11px] font-semibold tracking-[.06em] text-ink-3">{topic.ref}</span>
                                        ) : null}
                                        <strong className="font-semibold" dir="auto">
                                            {topic.title}
                                        </strong>
                                    </td>
                                    <td className={td}>
                                        {topic.topic && (TOPICS as readonly string[]).includes(topic.topic) ? p(`topics.${topic.topic as Topic}`) : '–'}
                                    </td>
                                    <td className={td}>
                                        {topic.skills.length ? (
                                            <span className="flex flex-wrap gap-1.5">
                                                {topic.skills.slice(0, 6).map((k) => (
                                                    <span key={k} className="rounded-full bg-fill px-2 py-0.5 text-[12.5px] text-ink-2">
                                                        {k}
                                                    </span>
                                                ))}
                                                {topic.skills.length > 6 ? <span className="text-[12.5px] text-ink-3">+{topic.skills.length - 6}</span> : null}
                                            </span>
                                        ) : (
                                            <span className="text-[13.5px] text-warn-fg">{t('noSkillsFound')}</span>
                                        )}
                                    </td>
                                    <td className={cn(td, 'tabular-nums')}>{topic.pdf_page ?? '–'}</td>
                                    <td className={td}>
                                        <span
                                            className={cn(
                                                'inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold',
                                                statePill[state],
                                            )}
                                        >
                                            {t(stateKey[state])}
                                        </span>
                                        {topic.review_status === 'pending' && topic.review_note ? (
                                            <span className="mt-1 block max-w-[220px] text-xs text-ink-3">{topic.review_note}</span>
                                        ) : null}
                                    </td>
                                    <td className={cn(td, 'text-end')}>
                                        <Button variant="secondary" size="sm" onClick={() => onEdit(topic.id)}>
                                            {t('edit')}
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

// BookCheckScreen is the check of one imported PFE book: its PDF, what its topics have in common, the topics
// ai-api proposed, and « Publier ». Nothing of the book is shown to students before that.
export default function BookCheckScreen({ id }: { id: string }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const router = useRouter()
    const { data: book, isLoading, isError } = useAdminBook(id)
    const publish = usePublishBook(id)
    const retry = useRetryBook(id)
    const remove = useDeleteBook()
    const [picked, setPicked] = useState<Set<string> | null>(null)
    const [editing, setEditing] = useState<string>()
    const [problem, setProblem] = useState('')
    const topics = book?.topics ?? []
    // Until the admin ticks anything, the topics that are ready are ticked.
    const chosen = picked ?? new Set(defaultPicked(topics))
    const selected = topics.filter((x) => canPublish(x) && chosen.has(x.id)).map((x) => x.id)
    const waiting = tally(topics).waiting
    const wrap = 'mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]'
    const back = (
        <Link href="/admin/books" className="self-start text-[15px] font-semibold text-violet no-underline hover:text-violet-hover">
            <span aria-hidden className="rtl:hidden">
                ←{' '}
            </span>
            <span aria-hidden className="hidden rtl:inline">
                →{' '}
            </span>
            {t('backToBooks')}
        </Link>
    )
    if (isLoading) {
        return (
            <div className={wrap}>
                <div className="sk h-10 w-2/3 rounded-lg" />
                <div className="sk h-[320px] rounded-[22px]" />
            </div>
        )
    }
    if (isError || !book) {
        return (
            <div className={wrap}>
                {back}
                <p role="alert" className="m-0 text-[15px] text-[#B42318]">
                    {t('bookNotFound')}
                </p>
            </div>
        )
    }
    const toggle = (topicId: string) => {
        const next = new Set(chosen)
        if (next.has(topicId)) next.delete(topicId)
        else next.add(topicId)
        setPicked(next)
    }
    const doPublish = () => {
        setProblem('')
        publish.mutate(selected, {
            onSuccess: () => {
                setPicked(null)
                toast(t('bookPublishedToast', { count: selected.length }))
            },
            onError: (e) => setProblem(apiError(e) ?? t('stateError')),
        })
    }
    const doRetry = () => {
        setProblem('')
        retry.mutate(undefined, {
            onSuccess: () => toast(t('bookRetryStarted')),
            onError: (e) => setProblem(isAxiosError(e) && e.response?.status === 409 ? t('bookRetryBusy') : (apiError(e) ?? t('stateError'))),
        })
    }
    const doDelete = () => {
        if (!window.confirm(t('bookDeleteConfirm', { company: book.company }))) return
        setProblem('')
        remove.mutate(book.id, {
            onSuccess: () => {
                toast(t('bookDeleted'))
                router.push('/admin/books')
            },
            onError: (e) => setProblem(apiError(e) ?? t('stateError')),
        })
    }
    const read = book.status === 'draft' || book.status === 'published'
    return (
        <div className={wrap}>
            <Steps book={book} />
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="flex min-w-0 flex-col gap-2">
                    {back}
                    <h1 className="m-0 font-display text-[36px] font-extrabold leading-[1.08] tracking-tightish" dir="auto">
                        {read ? t('bookFound', { company: book.company, count: topics.length }) : t('bookOf', { company: book.company })}
                    </h1>
                    <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('bookCheckIntro')}</p>
                    <div>
                        <BookPill status={book.status} />
                    </div>
                </div>
                <div className="w-full max-w-[420px]">
                    <FileCard book={book} />
                </div>
            </div>
            {book.status === 'importing' ? (
                <div role="status" className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5">
                    <p className="m-0 text-[15px] font-semibold">{t('bookReading')}</p>
                    <p className="m-0 text-[14.5px] text-ink-3">{t('bookReadingHint')}</p>
                    <div className="sk h-10 rounded-lg" />
                    <div className="sk h-10 rounded-lg" />
                </div>
            ) : null}
            {book.status === 'failed' ? (
                <div role="alert" className="flex flex-col gap-3 rounded-[18px] border border-[#FDA29B] bg-[#FEF3F2] p-5">
                    <p className="m-0 text-[15px] font-semibold text-[#B42318]">{t(book.import_error ? errorKey[book.import_error] : 'bookErrAi')}</p>
                    <div className="flex flex-wrap gap-2.5">
                        <Button onClick={doRetry} disabled={retry.isPending}>
                            {t('bookRetry')}
                        </Button>
                    </div>
                </div>
            ) : null}
            {read && book.import_error === 'partial' ? (
                <p role="status" className="m-0 rounded-[14px] bg-warn-bg px-4 py-3 text-[14.5px] text-warn-fg">
                    {t('bookErrPartial')}
                </p>
            ) : null}
            {read ? <CommonForm book={book} /> : null}
            {read ? <Topics book={book} picked={chosen} onToggle={toggle} onEdit={setEditing} /> : null}
            {problem ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {problem}
                </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-line bg-white px-5 py-4">
                {read ? (
                    <span className="me-auto text-[15px] text-ink-2">
                        {waiting ? (
                            <>
                                <strong className="text-ink">{t('bookSelected', { selected: selected.length, total: waiting })}</strong> {t('bookSelectedHint')}
                            </>
                        ) : (
                            t('bookAllPublished')
                        )}
                    </span>
                ) : (
                    <span className="me-auto" />
                )}
                {book.status !== 'published' ? (
                    <Button variant="link" className="text-[#B42318] hover:text-[#912018]" onClick={doDelete} disabled={remove.isPending}>
                        {t('bookDelete')}
                    </Button>
                ) : (
                    <ButtonLink href={`/books/${book.id}`} variant="secondary">
                        {t('bookPreview')}
                    </ButtonLink>
                )}
                {read && waiting ? (
                    <Button onClick={doPublish} disabled={publish.isPending || selected.length === 0}>
                        {t('bookPublish', { count: selected.length })}
                    </Button>
                ) : null}
            </div>
            {editing ? <TopicEditor id={editing} onClose={() => setEditing(undefined)} /> : null}
        </div>
    )
}
