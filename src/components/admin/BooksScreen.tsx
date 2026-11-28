'use client'

import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAdminBooks, useAutoPublish, useImportBook, useStartAutoPublish } from '@/hooks/useAdminBooks'
import { cn } from '@/lib/cn'
import type { AdminBook, AutoPublishRun, BookStatus } from '@/types/job'
import { apiError, WhenText } from './SourcesScreen'
import { addToQueue, fileSize, importFailure, MAX_BATCH, sendable, type QueueItem } from './books'
import { when } from './collect'

const pill: Record<BookStatus, string> = {
    importing: 'bg-violet-soft text-violet-hover',
    draft: 'bg-warn-bg text-warn-fg',
    failed: 'bg-[#FEF3F2] text-[#B42318]',
    published: 'bg-ok-bg text-ok-fg',
}
const pillKey = { importing: 'bookImporting', draft: 'bookDraft', failed: 'bookFailed', published: 'bookPublished' } as const

// BookPill says where a book stands (also on its check screen).
export function BookPill({ status }: { status: BookStatus }) {
    const t = useTranslations('admin')
    return (
        <span className={cn('inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold', pill[status])}>{t(pillKey[status])}</span>
    )
}

// FileLine writes « 24 pages · 2,4 Mo » for a book's PDF.
export function FileLine({ book }: { book: Pick<AdminBook, 'pages' | 'file_size'> }) {
    const t = useTranslations('admin')
    const format = useFormatter()
    const size = fileSize(book.file_size)
    const parts = [
        book.pages ? t('bookPages', { count: book.pages }) : '',
        size ? t(size.unit === 'mb' ? 'sizeMb' : 'sizeKb', { value: format.number(size.value, { maximumFractionDigits: 1 }) }) : '',
    ].filter(Boolean)
    return <>{parts.join(' · ')}</>
}

// ImportCard takes one or many PDFs of PFE books. They are sent one after the other (job-api reads two at a time);
// each line says where its file stands, and a file that failed on the way can be sent again.
function ImportCard() {
    const t = useTranslations('admin')
    const format = useFormatter()
    const toast = useToast()
    const router = useRouter()
    const imp = useImportBook()
    const input = useRef<HTMLInputElement>(null)
    const [queue, setQueue] = useState<QueueItem<File>[]>([])
    const [running, setRunning] = useState(false)
    const [over, setOver] = useState(false)
    const [notice, setNotice] = useState('')

    const add = (files: FileList | null) => {
        if (!files?.length) return
        const { queue: next, overflow } = addToQueue(queue, Array.from(files))
        setQueue(next)
        setNotice(overflow ? t('bookBatchOverflow', { count: overflow, max: MAX_BATCH }) : '')
        if (input.current) input.current.value = ''
    }
    const patch = (key: string, p: Partial<QueueItem<File>>) => setQueue((q) => q.map((x) => (x.key === key ? { ...x, ...p } : x)))
    const remove = (key: string) => setQueue((q) => q.filter((x) => x.key !== key))
    const todo = queue.filter(sendable)

    const run = async () => {
        if (running || todo.length === 0) return
        setRunning(true)
        setNotice('')
        let received = 0
        let last = ''
        for (const item of todo) {
            patch(item.key, { state: 'sending', error: undefined, message: undefined })
            try {
                const b = await imp.mutateAsync({ file: item.file, company: item.company.trim() })
                patch(item.key, { state: 'sent', bookId: b.id })
                received++
                last = b.id
            } catch (err) {
                const status = isAxiosError(err) ? err.response?.status : undefined
                const error = importFailure(status)
                patch(item.key, { state: 'failed', error, message: error === 'other' ? (apiError(err) ?? undefined) : undefined })
            }
        }
        setRunning(false)
        if (received === 0) return
        toast(t('booksReceived', { count: received }))
        // A single book opens on its check screen, as before; a batch stays here, the list below follows the readings.
        if (queue.length === 1 && todo.length === 1) router.push(`/admin/books/${last}`)
    }

    const errorText = (q: QueueItem<File>) =>
        q.error === 'notPdf'
            ? t('pdfNotPdf')
            : q.error === 'tooLarge'
              ? t('pdfTooLarge')
              : q.error === 'scanned'
                ? t('pdfScanned')
                : (q.message ?? t('bookQueueError'))

    return (
        <section aria-labelledby="import-h" className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card">
            <div className="flex flex-col gap-1">
                <h2 id="import-h" className="m-0 text-xl font-extrabold">
                    {t('bookImportTitle')}
                </h2>
                <p className="m-0 max-w-[760px] text-[15px] leading-[1.55] text-ink-3">{t('bookImportIntro')}</p>
            </div>
            <label
                onDragOver={(e) => {
                    e.preventDefault()
                    setOver(true)
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setOver(false)
                    if (!running) add(e.dataTransfer.files)
                }}
                className={cn(
                    'flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-line-strong bg-fill px-4 py-6 text-center transition-colors hover:border-ink',
                    over && 'border-ink bg-violet-soft',
                    running && 'pointer-events-none opacity-60',
                )}
            >
                <span className="text-[15px] font-semibold text-ink">{t('bookDrop')}</span>
                <span className="text-[13px] text-ink-3">{t('bookDropHint', { max: MAX_BATCH })}</span>
                <input
                    ref={input}
                    type="file"
                    name="file"
                    multiple
                    accept="application/pdf,.pdf"
                    disabled={running}
                    aria-label={t('bookFiles')}
                    onChange={(e) => add(e.target.files)}
                    className="sr-only"
                />
            </label>

            {queue.length > 0 ? (
                <ul aria-label={t('bookFiles')} className="m-0 flex list-none flex-col gap-2 p-0">
                    {queue.map((q) => {
                        const size = fileSize(q.file.size)
                        const editable = !running && (q.state === 'waiting' || (q.state === 'failed' && sendable(q)))
                        return (
                            <li
                                key={q.key}
                                className="grid items-center gap-x-3 gap-y-2 rounded-xl border border-line-soft px-3.5 py-2.5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.2fr)_2rem]"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-[14.5px] font-semibold" dir="ltr" title={q.file.name}>
                                        {q.file.name}
                                    </span>
                                    {size ? (
                                        <span className="block text-xs text-ink-3">
                                            {t(size.unit === 'mb' ? 'sizeMb' : 'sizeKb', { value: format.number(size.value, { maximumFractionDigits: 1 }) })}
                                        </span>
                                    ) : null}
                                </span>
                                <input
                                    className={cn(inputClass, 'h-10')}
                                    aria-label={t('bookCompanyOf', { file: q.file.name })}
                                    placeholder={t('bookCompanyPlaceholder')}
                                    maxLength={200}
                                    value={q.company}
                                    disabled={!editable}
                                    onChange={(e) => patch(q.key, { company: e.target.value })}
                                />
                                <span className="min-w-0 text-[13.5px]" aria-live="polite">
                                    {q.state === 'waiting' ? <span className="text-ink-3">{t('bookQueueWaiting')}</span> : null}
                                    {q.state === 'sending' ? <span className="font-semibold text-violet-hover">{t('bookSending')}</span> : null}
                                    {q.state === 'sent' ? (
                                        <span className="flex items-center gap-2 font-semibold text-ok-fg">
                                            {t('bookQueueSent')}
                                            <ButtonLink href={`/admin/books/${q.bookId}`} variant="link" size="sm" className="hit">
                                                {t('bookOpen')}
                                            </ButtonLink>
                                        </span>
                                    ) : null}
                                    {q.state === 'failed' ? <span className="text-[#B42318]">{errorText(q)}</span> : null}
                                </span>
                                {q.state !== 'sending' && q.state !== 'sent' && !running ? (
                                    <button
                                        type="button"
                                        onClick={() => remove(q.key)}
                                        aria-label={t('bookQueueRemove', { file: q.file.name })}
                                        className="hit flex h-8 w-8 cursor-pointer items-center justify-center justify-self-end rounded-full border-0 bg-fill text-lg text-ink-2"
                                    >
                                        ×
                                    </button>
                                ) : (
                                    <span />
                                )}
                            </li>
                        )
                    })}
                </ul>
            ) : null}

            {notice ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {notice}
                </p>
            ) : (
                <p className="m-0 text-[12.5px] text-ink-3">{t('bookFileHint')}</p>
            )}

            {queue.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="secondary" disabled={running} onClick={() => setQueue([])}>
                        {t('bookClear')}
                    </Button>
                    <Button disabled={running || todo.length === 0} onClick={run}>
                        {running ? t('bookSending') : t('bookImportMany', { count: todo.length })}
                    </Button>
                </div>
            ) : null}
        </section>
    )
}

// AutoPublishProgress writes where the automatic run stands: what it published, what is left, and when it ended.
export function AutoPublishProgress({ run }: { run: AutoPublishRun }) {
    const t = useTranslations('admin')
    const counts = [
        ['autoBooks', run.books_published],
        ['autoTopics', run.topics_published],
        ['autoLeft', run.topics_left],
        ['autoOffers', run.offers_published],
        ['autoRetried', run.retried],
        ['autoErrors', run.errors],
    ] as const
    return (
        <div className="flex flex-col gap-2" aria-live="polite">
            <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {counts.map(([key, value]) => (
                    <div key={key} className="flex flex-col rounded-xl bg-fill px-3 py-2">
                        <dt className="text-[12.5px] text-ink-3">{t(key)}</dt>
                        <dd className={cn('m-0 text-lg font-bold tabular-nums', key === 'autoErrors' && value > 0 && 'text-[#B42318]')}>{value}</dd>
                    </div>
                ))}
            </dl>
            {run.running ? (
                <p className="m-0 text-[13.5px] font-semibold text-violet-hover">{t('autoRunning')}</p>
            ) : run.finished_at ? (
                <p className="m-0 text-[13.5px] text-ink-3">
                    {t('autoFinished')} <WhenText value={when(run.finished_at)} />
                </p>
            ) : null}
        </div>
    )
}

// AutoPublishCard starts the automatic publication of the read books and follows it until it ends.
function AutoPublishCard() {
    const t = useTranslations('admin')
    const toast = useToast()
    const run = useAutoPublish()
    const start = useStartAutoPublish()
    const [already, setAlready] = useState(false)
    const running = !!run.data?.running
    const go = () =>
        start.mutate(undefined, {
            onSuccess: (r) => setAlready(!r.started),
            onError: (e) => toast(apiError(e) ?? t('autoError')),
        })
    return (
        <section aria-labelledby="auto-h" className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
                    <h2 id="auto-h" className="m-0 text-xl font-extrabold">
                        {t('autoTitle')}
                    </h2>
                    <p className="m-0 max-w-[760px] text-[15px] leading-[1.55] text-ink-3">{t('autoIntro')}</p>
                </div>
                <Button onClick={go} disabled={start.isPending || running}>
                    {t('autoStart')}
                </Button>
            </div>
            {already && running ? <p className="m-0 text-sm font-semibold text-warn-fg">{t('autoAlready')}</p> : null}
            {run.data && (run.data.running || run.data.finished_at) ? <AutoPublishProgress run={run.data} /> : null}
        </section>
    )
}

// BooksScreen is « PFE books » of the admin: drop the PDF of a book, then open it to check its topics and publish.
export default function BooksScreen() {
    const t = useTranslations('admin')
    const { data, isLoading, isError } = useAdminBooks()
    const cols = 'grid grid-cols-[1.6fr_1.2fr_1fr_1fr_110px] items-center gap-3 px-4'
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('booksTitle')}</h1>
                <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('booksSubtitle')}</p>
            </div>
            <ImportCard />
            <AutoPublishCard />
            <section aria-labelledby="books-h" className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
                <h2 id="books-h" className="m-0 text-xl font-extrabold">
                    {t('booksList')}
                </h2>
                <div role="table" aria-labelledby="books-h" className="overflow-x-auto">
                    <div role="row" className={cn(cols, 'min-w-[820px] rounded-[10px] bg-fill-3 py-2.5 text-[13px] font-semibold text-ink-3')}>
                        <span role="columnheader">{t('colBook')}</span>
                        <span role="columnheader">{t('colFile')}</span>
                        <span role="columnheader">{t('colTopics')}</span>
                        <span role="columnheader">{t('colState')}</span>
                        <span role="columnheader" className="sr-only">
                            {t('bookOpen')}
                        </span>
                    </div>
                    {isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                    {isError ? (
                        <p role="alert" className="m-0 px-4 py-6 text-sm text-[#B42318]">
                            {t('booksError')}
                        </p>
                    ) : null}
                    {data && data.length === 0 ? <p className="m-0 px-4 py-6 text-sm text-ink-3">{t('noBooks')}</p> : null}
                    {data?.map((b) => (
                        <div role="row" key={b.id} className={cn(cols, 'min-w-[820px] border-b border-line-soft py-3.5 text-[14.5px] last:border-b-0')}>
                            <span role="cell" className="min-w-0">
                                <span className="block truncate font-bold text-ink">{b.company}</span>
                                <span className="block truncate text-xs text-ink-3">
                                    {b.title} · <WhenText value={when(b.created_at)} />
                                </span>
                            </span>
                            <span role="cell" className="min-w-0">
                                <span className="block truncate" dir="ltr" title={b.file_name ?? undefined}>
                                    {b.file_name ?? '–'}
                                </span>
                                <span className="block text-xs text-ink-3">
                                    <FileLine book={b} />
                                </span>
                            </span>
                            <span role="cell">
                                {b.status === 'importing' ? '–' : t('bookCounts', { pending: b.counts.pending, published: b.counts.published })}
                            </span>
                            <span role="cell">
                                <BookPill status={b.status} />
                            </span>
                            <span role="cell" className="flex justify-end">
                                <ButtonLink href={`/admin/books/${b.id}`} variant="secondary" size="sm">
                                    {t('bookOpen')}
                                </ButtonLink>
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
