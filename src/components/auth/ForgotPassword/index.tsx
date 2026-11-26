'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import AuthService from '@/services/AuthService'
import { AuthField, FormError, submitClass } from '../shared/AuthForm'

// ForgotPassword asks account-api to email a 6-digit code; the answer never says whether the email exists.
const ForgotPassword = () => {
    const t = useTranslations('auth')
    const [sent, setSent] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const email = String(new FormData(e.currentTarget).get('email') ?? '').trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('errEmail'))
        setBusy(true)
        setError('')
        try {
            await AuthService.forgotPassword(email)
            setSent(email)
        } catch {
            setError(t('errGeneric'))
        } finally {
            setBusy(false)
        }
    }
    return (
        <>
            <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-[30px] font-extrabold">{t('forgotTitle')}</h2>
                <p className="m-0 text-[15px] leading-normal text-ink-3">{t('forgotText')}</p>
            </div>
            {sent ? (
                <p role="status" className="m-0 rounded-xl bg-ok-bg px-3.5 py-3 text-sm text-ok-fg">
                    {t('forgotSent')}
                </p>
            ) : null}
            <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
                <FormError message={error} />
                <AuthField label={t('email')} name="email" type="email" autoComplete="email" required placeholder={t('emailPlaceholder')} />
                <button type="submit" disabled={busy} className={submitClass}>
                    {t('forgotSend')}
                </button>
            </form>
            <div className="flex justify-between text-sm font-medium">
                <Link href="/auth/signin" className="hit">
                    {t('back')}
                </Link>
                <Link href={`/auth/reset-password${sent ? `?email=${encodeURIComponent(sent)}` : ''}`} className="hit">
                    {t('haveCode')}
                </Link>
            </div>
        </>
    )
}

export default ForgotPassword
