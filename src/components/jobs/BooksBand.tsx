'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Book } from '@/types/job'
import { BookCover } from './OfferDetail'
import { COVERS } from './offer'

// BookTile is one PFE book: its cover, company and how many of its topics are open and fit the student.
export function BookTile({ book, index }: { book: Book; index: number }) {
    const t = useTranslations('offers')
    return (
        <Link
            href={`/books/${book.id}`}
            className="flex min-w-0 flex-[1_1_200px] items-center gap-3 rounded-xl border border-line-soft bg-white p-3 text-ink no-underline hover:text-ink"
        >
            <BookCover year={book.year} color={COVERS[index % COVERS.length]} />
            <span className="flex min-w-0 flex-col">
                <strong className="truncate text-sm font-semibold">{book.company}</strong>
                <span className="text-[12.5px] text-ink-3">{t('bookCount', { count: book.open_jobs, fit: book.for_you })}</span>
            </span>
        </Link>
    )
}

// BooksBand is the dark « PFE books » block shown after the first offers.
export default function BooksBand({ books, total }: { books: Book[]; total: number }) {
    const t = useTranslations('offers')
    return (
        <section aria-labelledby="pfe-books" className="flex flex-col gap-3.5 rounded-2xl bg-ink p-[18px] text-white">
            <div className="flex items-baseline justify-between gap-3">
                <span className="flex flex-col gap-0.5">
                    <strong id="pfe-books" className="font-display text-lg font-extrabold">
                        {t('booksTitle')}
                    </strong>
                    <span className="text-[13.5px] text-[#B8BCC6]">{t('booksSubtitle')}</span>
                </span>
                <Link href="/books" className="hit whitespace-nowrap text-sm font-semibold text-lime no-underline hover:text-lime-soft">
                    {t('booksAll', { count: total })}
                </Link>
            </div>
            <div className="flex flex-wrap gap-2.5">
                {books.slice(0, 3).map((b, i) => (
                    <BookTile key={b.id} book={b} index={i} />
                ))}
            </div>
        </section>
    )
}
