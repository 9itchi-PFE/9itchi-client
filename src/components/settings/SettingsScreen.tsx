'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { SCHOOLS } from '@/components/auth/SignUp'
import { Sk } from '@/components/jobs/OfferStates'
import { Button } from '@/components/ui/Button'
import { Field, inputClass } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useMe, useUpdateMe } from '@/hooks/useAccount'
import { cn } from '@/lib/cn'
import { profileInput } from './profile'

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
    const [error, setError] = useState('')

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
        const built = profileInput(String(f.get('name') ?? ''), String(f.get('school') ?? ''))
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
                <p className="m-0 text-[14.5px] leading-[1.55] text-ink-3">{t('deleteText')}</p>
                <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => signOut()}>
                        {t('signOut')}
                    </Button>
                    <Link href="/support" className="inline-flex h-11 items-center text-sm font-medium underline">
                        {t('deleteAsk')}
                    </Link>
                </div>
            </section>
        </main>
    )
}
