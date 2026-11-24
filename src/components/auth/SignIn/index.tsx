'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { AuthField, AuthHeading, FormError, SsoButtons, submitClass } from '../shared/AuthForm'
import { landingPath } from '../shared/landing'

const providers: Record<string, string> = { google: 'Google', linkedin: 'LinkedIn' }

const SignIn = () => {
    const t = useTranslations('auth')
    const router = useRouter()
    const params = useSearchParams()
    const oauth = params.get('error')?.match(/^(google|linkedin)_failed$/)?.[1]
    const [error, setError] = useState(oauth ? t('errOauth', { provider: providers[oauth] }) : '')
    const [busy, setBusy] = useState(false)

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        setBusy(true)
        setError('')
        const res = await signIn('credentials', { email: form.get('email'), password: form.get('password'), redirect: false })
        if (!res || res.error) {
            setBusy(false)
            setError(res?.error === 'CredentialsSignin' ? t('errCredentials') : t('errGeneric'))
            return
        }
        router.replace(await landingPath(params.get(REDIRECT_URL_KEY)))
    }

    return (
        <>
            <AuthHeading title={t('loginTitle')} subtitle={t('loginSubtitle')} switchLabel={t('loginSwitch')} switchHref="/auth/signup" />
            <SsoButtons />
            <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
                <FormError message={error} />
                <AuthField label={t('email')} name="email" type="email" autoComplete="email" required placeholder={t('emailPlaceholder')} />
                <AuthField
                    label={t('password')}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder={t('passwordPlaceholder')}
                />
                <Link href="/auth/forgot-password" className="self-end text-sm font-medium underline">
                    {t('forgot')}
                </Link>
                <button type="submit" disabled={busy} className={submitClass}>
                    {t('login')}
                </button>
            </form>
        </>
    )
}

export default SignIn
