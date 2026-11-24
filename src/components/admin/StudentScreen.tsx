'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { useFormatter, useTranslations } from 'next-intl'
import { initials } from '@/components/layouts/StudentLayout/AccountMenu'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAdminUser, useDeleteUser, useSuspendUser } from '@/hooks/useAdminUsers'
import { cn } from '@/lib/cn'
import { apiError } from './SourcesScreen'
import { statusPill } from './StudentsScreen'
import { studentId } from './students'

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 text-[14.5px]">
            <dt className="flex-none text-ink-3">{label}</dt>
            <dd className="m-0 min-w-0 truncate text-end">{children}</dd>
        </div>
    )
}

// StudentScreen is the file of one student: who they are, and what the team can do with the account.
export default function StudentScreen({ id }: { id: string }) {
    const t = useTranslations('admin')
    const format = useFormatter()
    const router = useRouter()
    const toast = useToast()
    const { data: user, isLoading, error } = useAdminUser(studentId(id))
    const suspend = useSuspendUser()
    const remove = useDeleteUser()
    const [problem, setProblem] = useState('')
    const missing = !studentId(id) || (isAxiosError(error) && error.response?.status === 404)
    const day = (iso: string) => format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' })

    const setSuspended = (suspended: boolean) => {
        if (!user || (suspended && !window.confirm(t('suspendConfirm', { name: user.name || user.email })))) return
        setProblem('')
        suspend.mutate(
            { id: user.id, suspended },
            { onSuccess: () => toast(suspended ? t('suspended') : t('reactivated')), onError: (e) => setProblem(apiError(e) ?? t('stateError')) },
        )
    }
    const del = () => {
        if (!user || !window.confirm(t('deleteStudentConfirm', { name: user.name || user.email }))) return
        setProblem('')
        remove.mutate(user.id, {
            onSuccess: () => {
                toast(t('studentDeleted'))
                router.push('/admin/users')
            },
            onError: (e) => setProblem(apiError(e) ?? t('stateError')),
        })
    }
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <Link href="/admin/users" className="self-start text-[15px] font-semibold text-violet no-underline hover:text-violet-hover">
                <span aria-hidden className="inline-block rtl:-scale-x-100">
                    ←
                </span>{' '}
                {t('studentsTitle')}
            </Link>
            {isLoading ? <div className="sk h-72 max-w-[420px] rounded-[22px]" /> : null}
            {missing ? <p className="m-0 text-base text-ink-3">{t('studentMissing')}</p> : null}
            {error && !missing ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('studentsError')}
                </p>
            ) : null}
            {user ? (
                <section
                    aria-labelledby="student-h"
                    className="flex w-full max-w-[420px] flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card"
                >
                    <div className="flex items-center gap-3.5">
                        <span
                            aria-hidden
                            className="flex h-16 w-16 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-violet-soft text-xl font-extrabold text-violet-hover"
                        >
                            {initials(user.name)}
                        </span>
                        <div className="flex min-w-0 flex-col items-start gap-1.5">
                            <h1 id="student-h" className="m-0 max-w-full truncate text-xl font-extrabold">
                                <bdi>{user.name || user.email}</bdi>
                            </h1>
                            <span className={cn('rounded-full px-2.5 py-[3px] text-[13px] font-semibold', statusPill(user.status))}>
                                {user.status === 'active' ? t('studentActive') : t('studentSuspended')}
                            </span>
                        </div>
                    </div>
                    <dl className="m-0 flex flex-col gap-2.5 border-b border-line-soft pb-4">
                        <Row label={t('sEmail')}>
                            <span dir="ltr">{user.email}</span>
                        </Row>
                        <Row label={t('colSchool')}>{user.school || '–'}</Row>
                        <Row label={t('colJoined')}>{day(user.created_at)}</Row>
                        <Row label={t('sLanguage')}>{t(`lang.${user.language === 'en' || user.language === 'ar' ? user.language : 'fr'}`)}</Row>
                        {user.role === 'admin' ? <Row label={t('sRole')}>{t('sAdmin')}</Row> : null}
                    </dl>
                    {problem ? (
                        <p role="alert" className="m-0 text-sm text-[#B42318]">
                            {problem}
                        </p>
                    ) : null}
                    <div className="flex flex-col gap-2.5">
                        {user.status === 'active' ? (
                            <Button
                                variant="secondary"
                                className="border-[#F5C6A5] text-[#B54708] hover:text-[#93370D]"
                                disabled={suspend.isPending}
                                onClick={() => setSuspended(true)}
                            >
                                {t('suspend')}
                            </Button>
                        ) : (
                            <Button variant="secondary" disabled={suspend.isPending} onClick={() => setSuspended(false)}>
                                {t('reactivate')}
                            </Button>
                        )}
                        <Button variant="secondary" className="border-[#F5B5AF] text-[#B42318] hover:text-[#912018]" disabled={remove.isPending} onClick={del}>
                            {t('deleteStudent')}
                        </Button>
                    </div>
                </section>
            ) : null}
        </div>
    )
}
