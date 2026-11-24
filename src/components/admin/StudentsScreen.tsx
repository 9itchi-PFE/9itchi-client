'use client'

import { useEffect, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { cn } from '@/lib/cn'
import type { UserStatus } from '@/types/user'
import { pages, studentsQuery } from './students'

export const statusPill = (status: string) => (status === 'active' ? 'bg-ok-bg text-ok-fg' : 'bg-[#FEF3F2] text-[#B42318]')

// StudentsScreen is « Étudiants »: every student account, searched by name or email, with its state.
export default function StudentsScreen() {
    const t = useTranslations('admin')
    const format = useFormatter()
    const [typed, setTyped] = useState('')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<UserStatus>('')
    const [page, setPage] = useState(1)
    // The list is asked for once the admin stops typing.
    useEffect(() => {
        const id = setTimeout(() => {
            setSearch(typed)
            setPage(1)
        }, 300)
        return () => clearTimeout(id)
    }, [typed])

    const { data, isLoading, isError, isPlaceholderData } = useAdminUsers(studentsQuery(search, status, page))
    const last = pages(data?.total ?? 0)
    const cols = 'grid grid-cols-[1.6fr_1.2fr_1fr_.8fr_100px] items-center gap-3 px-4'
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('studentsTitle')}</h1>
                <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('studentsSubtitle')}</p>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <Segmented
                    label={t('studentsFilter')}
                    value={status}
                    onChange={(v) => {
                        setStatus(v)
                        setPage(1)
                    }}
                    itemClassName="px-4 h-10 text-[15px]"
                    options={[
                        { value: '', label: t('studentsAll') },
                        { value: 'active', label: t('studentsActive') },
                        { value: 'suspended', label: t('studentsSuspended') },
                    ]}
                />
                <div className="w-full sm:w-[340px]">
                    <Field
                        type="search"
                        label={t('studentsSearch')}
                        placeholder={t('studentsSearchHint')}
                        maxLength={100}
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                    />
                </div>
            </div>
            <section aria-labelledby="students-h" className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card">
                <h2 id="students-h" className="m-0 text-xl font-extrabold">
                    {data ? t('studentsCount', { count: data.total }) : t('studentsTitle')}
                </h2>
                <div
                    role="table"
                    aria-labelledby="students-h"
                    aria-busy={isPlaceholderData}
                    className={cn('overflow-x-auto', isPlaceholderData && 'opacity-60')}
                >
                    <div role="row" className={cn(cols, 'min-w-[820px] rounded-[10px] bg-fill-3 py-2.5 text-[13px] font-semibold text-ink-3')}>
                        <span role="columnheader">{t('colStudent')}</span>
                        <span role="columnheader">{t('colSchool')}</span>
                        <span role="columnheader">{t('colJoined')}</span>
                        <span role="columnheader">{t('colState')}</span>
                        <span role="columnheader" className="sr-only">
                            {t('studentOpen')}
                        </span>
                    </div>
                    {isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                    {isError ? <p className="m-0 px-4 py-6 text-sm text-[#B42318]">{t('studentsError')}</p> : null}
                    {data && data.items.length === 0 ? (
                        <p className="m-0 px-4 py-6 text-sm text-ink-3">{search || status ? t('studentsNoMatch') : t('studentsNone')}</p>
                    ) : null}
                    {data?.items.map((u) => (
                        <div role="row" key={u.id} className={cn(cols, 'min-w-[820px] border-b border-line-soft py-3.5 text-[14.5px]')}>
                            <span role="cell" className="min-w-0">
                                <bdi className="block truncate font-bold">{u.name || '–'}</bdi>
                                <span dir="ltr" className="block truncate text-start text-xs text-ink-3">
                                    {u.email}
                                </span>
                            </span>
                            <span role="cell" className="min-w-0 truncate">
                                {u.school || '–'}
                            </span>
                            <span role="cell">{format.dateTime(new Date(u.created_at), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span role="cell">
                                <span className={cn('inline-block rounded-full px-2.5 py-[3px] text-[13px] font-semibold', statusPill(u.status))}>
                                    {u.status === 'active' ? t('studentActive') : t('studentSuspended')}
                                </span>
                            </span>
                            <span role="cell" className="flex justify-end">
                                <ButtonLink
                                    href={`/admin/users/${u.id}`}
                                    variant="secondary"
                                    size="sm"
                                    aria-label={t('studentOpenNamed', { name: u.name || u.email })}
                                >
                                    {t('studentOpen')}
                                </ButtonLink>
                            </span>
                        </div>
                    ))}
                </div>
                {data && last > 1 ? (
                    <nav aria-label={t('studentsPages')} className="flex items-center justify-end gap-3">
                        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            {t('pagePrev')}
                        </Button>
                        <span className="text-[13.5px] tabular-nums text-ink-3">{t('pageOf', { page, pages: last })}</span>
                        <Button variant="secondary" size="sm" disabled={page >= last} onClick={() => setPage(page + 1)}>
                            {t('pageNext')}
                        </Button>
                    </nav>
                ) : null}
            </section>
        </div>
    )
}
