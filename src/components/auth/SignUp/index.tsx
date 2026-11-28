'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import axios from 'axios'
import AuthService from '@/services/AuthService'
import { AuthField, AuthHeading, AuthSelect, FormError, SsoButtons, submitClass } from '../shared/AuthForm'

export const SCHOOLS = ['ENIS', 'ENIT', 'INSAT', 'ENSI', 'SUPCOM', 'ESPRIT', 'ENISO', 'ENIM', 'ENIG', 'ENICARTHAGE', 'ISIMM', 'ISI', 'FST', 'OTHER'] as const

// strongPassword mirrors account-api: 8 to 72 characters with an upper case letter, a lower case letter, a digit.
export const strongPassword = (p: string) => p.length >= 8 && p.length <= 72 && /\p{Lu}/u.test(p) && /\p{Ll}/u.test(p) && /\p{Nd}/u.test(p)

type Errors = Partial<Record<'name' | 'email' | 'password' | 'form', string>>

const SignUp = () => {
    const t = useTranslations('auth')
    const locale = useLocale()
    const router = useRouter()
    const [errors, setErrors] = useState<Errors>({})
    const [busy, setBusy] = useState(false)

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const name = String(f.get('name') ?? '').trim()
        const email = String(f.get('email') ?? '').trim()
        const password = String(f.get('password') ?? '')
        const school = String(f.get('school') ?? '')
        const next: Errors = {}
        if (!name) next.name = t('errName')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('errEmail')
        if (!strongPassword(password)) next.password = t('errPassword')
        setErrors(next)
        if (Object.keys(next).length) return
        setBusy(true)
        try {
            await AuthService.signUp({ name, email, password, school, language: locale })
            // No session yet: account-api emailed a 6-digit code, the next screen asks for it.
            router.push(`/auth/verify-email?${new URLSearchParams({ email, new: '1' })}`)
        } catch (err) {
            const status = axios.isAxiosError(err) ? err.response?.status : undefined
            const message = axios.isAxiosError(err) ? String(err.response?.data?.error ?? '') : ''
            setErrors(
                status === 409
                    ? { email: t('errExists') }
                    : status === 400 && message.includes('password')
                      ? { password: t('errPassword') }
                      : status === 400 && message.includes('email')
                        ? { email: t('errEmail') }
                        : { form: t('errGeneric') },
            )
            setBusy(false)
        }
    }

    return (
        <>
            <AuthHeading title={t('signupTitle')} subtitle={t('signupSubtitle')} switchLabel={t('signupSwitch')} switchHref="/auth/signin" />
            <SsoButtons />
            <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
                <FormError message={errors.form ?? ''} />
                <AuthField
                    id="su-name"
                    label={t('name')}
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder={t('name')}
                    error={errors.name}
                />
                <AuthField
                    id="su-email"
                    label={t('email')}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t('emailPlaceholder')}
                    error={errors.email}
                />
                <AuthField
                    id="su-password"
                    label={t('password')}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    maxLength={72}
                    placeholder={t('passwordPlaceholder')}
                    error={errors.password}
                />
                <AuthSelect label={t('school')} name="school" defaultValue="">
                    <option value="">{t('schoolPlaceholder')}</option>
                    {SCHOOLS.map((s) => (
                        <option key={s} value={s}>
                            {t(`schools.${s}`)}
                        </option>
                    ))}
                </AuthSelect>
                <button type="submit" disabled={busy} className={submitClass}>
                    {busy ? t('signingUp') : t('signup')}
                </button>
            </form>
            <p className="m-0 text-[13px] leading-normal text-ink-3">
                {t.rich('legal', {
                    terms: (c) => (
                        <Link href="/terms-conditions" className="underline">
                            {c}
                        </Link>
                    ),
                    privacy: (c) => (
                        <Link href="/privacy-policy" className="underline">
                            {c}
                        </Link>
                    ),
                })}
            </p>
        </>
    )
}

export default SignUp
