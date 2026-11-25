'use client'

import { useTranslations } from 'next-intl'
import { useBooks } from '@/hooks/useJobs'
import { BookTile } from './BooksBand'
import { Sk } from './OfferStates'

// BooksList is the list of PFE books behind « Voir les 23 → », drawn with the tiles of the offers screen band.
export default function BooksList() {
    const t = useTranslations('book')
    const tc = useTranslations('common')
    const books = useBooks()
    return (
        <main className="mx-auto box-border flex w-full max-w-[1320px] flex-col gap-6 px-4 sm:px-8 pb-16 pt-7">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[30px] sm:text-[44px] font-extrabold leading-[1.05]">{t('listTitle')}</h1>
                <p className="m-0 max-w-[680px] text-base text-ink-3">{t('listSubtitle')}</p>
            </div>
            {books.isError ? (
                <p role="alert" className="m-0 text-ink-3">
                    {tc('error')}
                </p>
            ) : !books.data ? (
                <div className="flex flex-wrap gap-2.5">
                    {[0, 1, 2].map((i) => (
                        <Sk key={i} className="h-[70px] flex-[1_1_200px] rounded-xl" />
                    ))}
                </div>
            ) : books.data.items.length === 0 ? (
                <p className="m-0 text-ink-3">{t('listEmpty')}</p>
            ) : (
                <div className="flex flex-wrap gap-2.5">
                    {books.data.items.map((b, i) => (
                        <BookTile key={b.id} book={b} index={i} />
                    ))}
                </div>
            )}
        </main>
    )
}
