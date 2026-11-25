'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { SCHOOLS } from '@/components/auth/SignUp'
import { Sk } from '@/components/jobs/OfferStates'
import { Button } from '@/components/ui/Button'
import { Field, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useDeleteMe, useMe, useUpdateMe } from '@/hooks/useAccount'
import { cn } from '@/lib/cn'
import { YEARS } from '@/types/user'
import { confirmed, profileInput } from './profile'

const main = 'mx-auto box-border flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 sm:px-8 pb-16 pt-8'
const card = 'flex flex-col gap-4 rounded-[20px] border border-line-soft bg-white p-6'
const LINKS = [
    { key: 'search', href: '/preferences' },
    { key: 'alerts', href: '/settings/alerts' },
    { key: 'gmail', href: '/settings/gmail' },
    { key: 'billing', href: '/settings/billing' },
    { key: 'support', href: '/support' },
] as const

// SettingsScreen is « Paramètres »: the student's name and school, and the way to every other setting.
export default function SettingsScreen() {
    const t = useTranslations('settings')
    const ta = useTranslations('auth')
    const tc = useTranslations('common')
    const toast = useToast()
    const me = useMe()
    const save = useUpdateMe()
    const remove = useDeleteMe()
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [typed, setTyped] = useState('')
    const [deleteError, setDeleteError] = useState('')

    if (me.isLoading) {
        return (
            <main aria-busy="true" className={main}>
                <Sk className="h-12 w-64 rounded-lg" />
                <Sk className="h-[300px] w-full rounded-[20px]" />
            </main>
        )
    }
    if (me.isError || !me.data) {
        return (
            <main className={cn(main, 'items-start')}>
                <h1 className="m-0 text-[30px] font-extrabold leading-[1.05] sm:text-[40px]">{t('title')}</h1>
                <p role="alert" className="m-0 text-base text-ink-3">
                    {tc('error')}
                </p>
                <Button onClick={() => me.refetch()}>{tc('retry')}</Button>
            </main>
        )
    }

    const user = me.data
    // A school typed before the list existed stays selectable.
    const schools: string[] = user.school && !(SCHOOLS as readonly string[]).includes(user.school) ? [user.school, ...SCHOOLS] : [...SCHOOLS]
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const get = (k: string) => String(f.get(k) ?? '')
        const built = profileInput(get('name'), get('school'), {
            phone: get('phone'),
            city: get('city'),
            speciality: get('speciality'),
            year: get('year'),
            linkedin: get('linkedin'),
            github: get('github'),
        })
        if ('error' in built) return setError(t(built.error))
        setError('')
        save.mutate(built.input, { onSuccess: () => toast(t('saved')), onError: () => setError(tc('error')) })
    }
    return (
        <main className={main}>
            <div className="flex flex-col gap-1.5">
                <h1 className="m-0 text-[30px] font-extrabold leading-[1.05] sm:text-[40px]">{t('title')}</h1>
                <p className="m-0 text-[15px] text-ink-3">{t('intro')}</p>
            </div>
            <section aria-labelledby="profile-h" className={card}>
                <h2 id="profile-h" className="m-0 text-xl font-extrabold">
                    {t('profile')}
                </h2>
                <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
                    <Field name="name" label={t('name')} required maxLength={100} autoComplete="name" defaultValue={user.name} />
                    <div className="flex flex-col gap-1.5">
                        <Field label={t('email')} type="email" dir="ltr" value={user.email} readOnly className="bg-fill-3 text-ink-3" />
                        <span className="text-[12.5px] text-ink-3">{t('emailHint')}</span>
                    </div>
                    <label className="flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                        {t('school')}
                        <select name="school" defaultValue={user.school ?? ''} className={inputClass}>
                            <option value="">{ta('schoolPlaceholder')}</option>
                            {schools.map((s) => (
                                <option key={s} value={s}>
                                    {(SCHOOLS as readonly string[]).includes(s) ? ta(`schools.${s}`) : s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <Field name="speciality" label={t('speciality')} maxLength={120} defaultValue={user.speciality ?? ''} />
                        <label className="flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                            {t('year')}
                            <select name="year" defaultValue={user.year ?? ''} className={inputClass}>
                                <option value="">{t('yearNone')}</option>
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>
                                        {t(`years.${y}`)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Field name="city" label={t('city')} maxLength={80} autoComplete="address-level2" defaultValue={user.city ?? ''} />
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <Field name="phone" label={t('phone')} type="tel" dir="ltr" maxLength={30} autoComplete="tel" defaultValue={user.phone ?? ''} />
                            <span className="text-[12.5px] text-ink-3">{t('phoneHint')}</span>
                        </div>
                        <Field name="linkedin" label="LinkedIn" dir="ltr" maxLength={200} placeholder="linkedin.com/in/…" defaultValue={user.linkedin ?? ''} />
                        <Field name="github" label="GitHub" dir="ltr" maxLength={200} placeholder="github.com/…" defaultValue={user.github ?? ''} />
                    </div>
                    <span className="text-[12.5px] text-ink-3">{t('optionalHint')}</span>
                    {error ? (
                        <p role="alert" className="m-0 text-sm text-[#B42318]">
                            {error}
                        </p>
                    ) : null}
                    <Button type="submit" className="self-start" disabled={save.isPending}>
                        {t('save')}
                    </Button>
                </form>
            </section>
            <section aria-labelledby="more-h" className={card}>
                <h2 id="more-h" className="m-0 text-xl font-extrabold">
                    {t('more')}
                </h2>
                <ul className="m-0 flex list-none flex-col p-0">
                    {LINKS.map((l) => (
                        <li key={l.key} className="border-t border-fill first:border-t-0">
                            <Link href={l.href} className="flex flex-col gap-0.5 py-3.5 text-ink no-underline hover:text-violet">
                                <strong className="text-[15px] font-semibold">{t(`links.${l.key}`)}</strong>
                                <span className="text-[13.5px] text-ink-3">{t(`links.${l.key}Text`)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
            <section aria-labelledby="session-h" className={card}>
                <h2 id="session-h" className="m-0 text-xl font-extrabold">
                    {t('session')}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={() => signOut()}>
                        {t('signOut')}
                    </Button>
                    <Button
                        variant="link"
                        className="text-[#B42318] hover:text-[#912018]"
                        onClick={() => {
                            setTyped('')
                            setDeleteError('')
                            setDeleting(true)
                        }}
                    >
                        {t('deleteOpen')}
                    </Button>
                </div>
            </section>
            <Modal open={deleting} onClose={() => setDeleting(false)} title={t('deleteTitle')} width={520}>
                <div className="flex flex-col gap-1.5 text-[14.5px] leading-[1.55] text-ink-2">
                    <strong className="text-ink">{t('deleteGone')}</strong>
                    <p className="m-0">{t('deleteGoneText')}</p>
                </div>
                <div className="flex flex-col gap-1.5 text-[14.5px] leading-[1.55] text-ink-2">
                    <strong className="text-ink">{t('deleteKept')}</strong>
                    <p className="m-0">{t('deleteKeptText')}</p>
                </div>
                <form
                    className="flex flex-col gap-3.5"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (!confirmed(typed, t('deleteWord')) || remove.isPending) return
                        setDeleteError('')
                        remove.mutate(undefined, {
                            onSuccess: () => signOut({ callbackUrl: '/auth/signin' }),
                            onError: () => setDeleteError(t('deleteFailed')),
                        })
                    }}
                >
                    <Field
                        label={t('deleteType', { word: t('deleteWord') })}
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        autoComplete="off"
                        autoCapitalize="characters"
                    />
                    {deleteError ? (
                        <p role="alert" className="m-0 text-sm text-[#B42318]">
                            {deleteError}
                        </p>
                    ) : null}
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeleting(false)}>
                            {t('deleteCancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={!confirmed(typed, t('deleteWord')) || remove.isPending}
                            className="bg-[#B42318] hover:bg-[#912018] disabled:bg-line disabled:text-ink-3"
                        >
                            {remove.isPending ? t('deleteBusy') : t('deleteConfirm')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </main>
    )
}
