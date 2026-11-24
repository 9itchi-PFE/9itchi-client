'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { tnd } from '@/components/billing/billing'
import { initials } from '@/components/layouts/StudentLayout/AccountMenu'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
    useAdminUser,
    useDeleteUser,
    useStudentApplications,
    useStudentGmail,
    useStudentPayments,
    useStudentSubscription,
    useSuspendUser,
} from '@/hooks/useAdminUsers'
import { cn } from '@/lib/cn'
import type { Application, ApplicationStatus } from '@/types/application'
import { apiError } from './SourcesScreen'
import { statusPill } from './StudentsScreen'
import { studentId } from './students'

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 text-[14.5px]">
            <dt className="flex-none text-ink-3">{label}</dt>
            <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">{children}</dd>
        </div>
    )
}

const appPill: Record<ApplicationStatus, string> = {
    scheduled: 'bg-violet-soft text-violet-hover',
    sent: 'bg-fill text-ink-2',
    opened: 'bg-ok-bg text-ok-fg',
    replied: 'bg-lime text-ink',
    withdrawn: 'bg-fill text-ink-3',
    closed: 'bg-fill text-ink-3',
    failed: 'bg-[#FEF3F2] text-[#B42318]',
}

// sentOn is the day an application left: when its email was sent, or when the student recorded it. A scheduled
// one has not left yet.
const sentOn = (a: Application) => a.email?.sent_at ?? (a.status === 'scheduled' || a.status === 'failed' ? null : a.created_at)

const panel = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-5'
const head = 'rounded-[10px] bg-fill-3 py-2.5 text-[13px] font-semibold text-ink-3'
const line = 'border-b border-line-soft py-3.5 text-[14.5px]'

// Applications are what the student sent and where each stands; who it was written to stays the student's own.
function Applications({ id }: { id: string }) {
    const t = useTranslations('admin')
    const format = useFormatter()
    const { data, isLoading, isError } = useStudentApplications(id)
    const cols = 'grid grid-cols-[1.6fr_1.3fr_.8fr_.7fr] items-center gap-3 px-4'
    return (
        <section aria-labelledby="apps-h" className={panel}>
            <h2 id="apps-h" className="m-0 text-xl font-extrabold">
                {t('sApplications')}
            </h2>
            <div role="table" aria-labelledby="apps-h" className="overflow-x-auto">
                <div role="row" className={cn(cols, 'min-w-[640px]', head)}>
                    <span role="columnheader">{t('colCompany')}</span>
                    <span role="columnheader">{t('colHow')}</span>
                    <span role="columnheader">{t('colState')}</span>
                    <span role="columnheader">{t('colSent')}</span>
                </div>
                {isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                {isError ? <p className="m-0 px-4 py-6 text-sm text-[#B42318]">{t('sPartError')}</p> : null}
                {data && data.length === 0 ? <p className="m-0 px-4 py-6 text-sm text-ink-3">{t('sNoApplications')}</p> : null}
                {data?.map((a) => (
                    <div role="row" key={a.id} className={cn(cols, 'min-w-[640px]', line)}>
                        <span role="cell" className="min-w-0">
                            <bdi className="block truncate font-bold">{a.company || '–'}</bdi>
                            {a.job_title ? <bdi className="block truncate text-xs text-ink-3">{a.job_title}</bdi> : null}
                        </span>
                        <span role="cell">{t(`appVia.${a.via === 'self' ? 'self' : 'gmail'}`)}</span>
                        <span role="cell">
                            <span className={cn('inline-block rounded-full px-2.5 py-[3px] text-[13px] font-semibold', appPill[a.status] ?? appPill.sent)}>
                                {a.status in appPill ? t(`appStatus.${a.status}`) : a.status}
                            </span>
                        </span>
                        <span role="cell">{sentOn(a) ? format.dateTime(new Date(sentOn(a) as string), { day: 'numeric', month: 'short' }) : '—'}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

function Payments({ id }: { id: string }) {
    const t = useTranslations('admin')
    const format = useFormatter()
    const locale = useLocale()
    const { data, isLoading, isError } = useStudentPayments(id)
    const cols = 'grid grid-cols-[1.2fr_1fr_1fr_.7fr] items-center gap-3 px-4'
    return (
        <section aria-labelledby="pays-h" className={panel}>
            <h2 id="pays-h" className="m-0 text-xl font-extrabold">
                {t('sPayments')}
            </h2>
            <div role="table" aria-labelledby="pays-h" className="overflow-x-auto">
                <div role="row" className={cn(cols, 'min-w-[560px]', head)}>
                    <span role="columnheader">{t('colReceipt')}</span>
                    <span role="columnheader">{t('colDate')}</span>
                    <span role="columnheader">{t('colAmount')}</span>
                    <span role="columnheader">{t('colState')}</span>
                </div>
                {isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                {isError ? <p className="m-0 px-4 py-6 text-sm text-[#B42318]">{t('sPartError')}</p> : null}
                {data && data.length === 0 ? <p className="m-0 px-4 py-6 text-sm text-ink-3">{t('sNoPayments')}</p> : null}
                {data?.map((p) => (
                    <div role="row" key={p.id} className={cn(cols, 'min-w-[560px]', line)}>
                        <span role="cell" className="tabular-nums">
                            <bdi dir="ltr">{p.receipt_no || '–'}</bdi>
                        </span>
                        <span role="cell">
                            {p.completed_at ? format.dateTime(new Date(p.completed_at), { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                        <span role="cell" className="tabular-nums">
                            {t('amountTnd', { amount: tnd(p.amount_millimes, locale) })}
                        </span>
                        <span role="cell">
                            <span className="inline-block rounded-full bg-ok-bg px-2.5 py-[3px] text-[13px] font-semibold text-ok-fg">{t('paid')}</span>
                        </span>
                    </div>
                ))}
            </div>
        </section>
    )
}

// StudentScreen is the file of one student: who they are, and what the team can do with the account.
export default function StudentScreen({ id }: { id: string }) {
    const t = useTranslations('admin')
    const format = useFormatter()
    const router = useRouter()
    const toast = useToast()
    const { data: user, isLoading, error } = useAdminUser(studentId(id))
    const sub = useStudentSubscription(user?.id ?? '')
    const gmail = useStudentGmail(user?.id ?? '')
    const suspend = useSuspendUser()
    const remove = useDeleteUser()
    const [problem, setProblem] = useState('')
    const missing = !studentId(id) || (isAxiosError(error) && error.response?.status === 404)
    const day = (iso: string) => format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' })
    const paid = sub.data && !sub.data.is_free ? sub.data.subscription : null
    const state = user?.status === 'active' ? t('studentActive') : t('studentSuspended')

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
                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <section
                        aria-labelledby="student-h"
                        className="flex w-full flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card"
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
                                    {paid ? t('sSubscriber', { state }) : state}
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
                            <Row label={t('sPlan')}>
                                {sub.isLoading
                                    ? '…'
                                    : !sub.data
                                      ? t('sUnknown')
                                      : !paid
                                        ? t('sPlanFree')
                                        : t(paid.renews ? 'sPlanPaid' : 'sPlanStopped', { name: sub.data.plan.name, day: new Date(paid.ends_at) })}
                            </Row>
                            <Row label={t('sGmail')}>
                                {gmail.isLoading ? '…' : !gmail.data ? t('sUnknown') : gmail.data.connected ? t('sGmailOn') : t('sGmailOff')}
                            </Row>
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
                            <Button
                                variant="secondary"
                                className="border-[#F5B5AF] text-[#B42318] hover:text-[#912018]"
                                disabled={remove.isPending}
                                onClick={del}
                            >
                                {t('deleteStudent')}
                            </Button>
                        </div>
                    </section>
                    <div className="flex min-w-0 flex-col gap-5">
                        <Applications id={user.id} />
                        <Payments id={user.id} />
                    </div>
                </div>
            ) : null}
        </div>
    )
}
