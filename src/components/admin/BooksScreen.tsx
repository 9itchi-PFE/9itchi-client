'use client'

import { useRef, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field, inputClass } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAdminBooks, useImportBook } from '@/hooks/useAdminBooks'
import { cn } from '@/lib/cn'
import type { AdminBook, BookStatus } from '@/types/job'
import { apiError, WhenText } from './SourcesScreen'
import { fileSize, pdfProblem } from './books'
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

function ImportCard() {
    const t = useTranslations('admin')
    const toast = useToast()
    const router = useRouter()
    const imp = useImportBook()
    const input = useRef<HTMLInputElement>(null)
    const [error, setError] = useState('')
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const file = input.current?.files?.[0]
        const problem = pdfProblem(file)
        if (problem || !file) {
            setError(t(({ missing: 'pdfMissing', notPdf: 'pdfNotPdf', tooLarge: 'pdfTooLarge' } as const)[problem ?? 'missing']))
            return
        }
        setError('')
        imp.mutate(
            { file, company: String(f.get('company') ?? '').trim() },
            {
                onSuccess: (b) => {
                    toast(t('bookReceived'))
                    router.push(`/admin/books/${b.id}`)
                },
                onError: (err) => {
                    const status = isAxiosError(err) ? err.response?.status : undefined
                    setError(status === 422 ? t('pdfScanned') : status === 413 ? t('pdfTooLarge') : (apiError(err) ?? t('stateError')))
                },
            },
        )
    }
    return (
        <section aria-labelledby="import-h" className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card">
            <div className="flex flex-col gap-1">
                <h2 id="import-h" className="m-0 text-xl font-extrabold">
                    {t('bookImportTitle')}
                </h2>
                <p className="m-0 max-w-[760px] text-[15px] leading-[1.55] text-ink-3">{t('bookImportIntro')}</p>
            </div>
            <form onSubmit={submit} className="grid items-end gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                    {t('bookFile')}
                    <input
                        ref={input}
                        type="file"
                        name="file"
                        accept="application/pdf,.pdf"
                        required
                        onChange={() => setError('')}
                        className={cn(
                            inputClass,
                            'cursor-pointer py-2 file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-fill file:px-2.5 file:py-1 file:text-sm file:font-semibold file:text-ink',
                        )}
                    />
                </label>
                <Field name="company" label={t('bookCompany')} maxLength={200} />
                <Button type="submit" disabled={imp.isPending}>
                    {imp.isPending ? t('bookSending') : t('bookImport')}
                </Button>
            </form>
            {error ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {error}
                </p>
            ) : (
                <p className="m-0 text-[12.5px] text-ink-3">{t('bookFileHint')}</p>
            )}
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
