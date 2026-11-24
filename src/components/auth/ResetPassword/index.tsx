'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import axios from 'axios'
import AuthService from '@/services/AuthService'
import { strongPassword } from '../SignUp'
import { AuthField, FormError, submitClass } from '../shared/AuthForm'

const ResetPassword = () => {
    const t = useTranslations('auth')
    const params = useSearchParams()
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const email = String(f.get('email') ?? '').trim()
        const code = String(f.get('code') ?? '').trim()
        const password = String(f.get('password') ?? '')
        if (!/^\d{6}$/.test(code)) return setError(t('errCode'))
        if (!strongPassword(password)) return setError(t('errPassword'))
        setBusy(true)
        setError('')
        try {
            await AuthService.resetPassword({ email, code, new_password: password })
            setDone(true)
        } catch (err) {
            const status = axios.isAxiosError(err) ? err.response?.status : undefined
            setError(status === 400 || status === 401 ? t('errCode') : t('errGeneric'))
        } finally {
            setBusy(false)
        }
    }
    return (
        <>
            <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-[30px] font-extrabold">{t('resetTitle')}</h2>
                <p className="m-0 text-[15px] leading-normal text-ink-3">{t('resetText')}</p>
            </div>
            {done ? (
                <p role="status" className="m-0 rounded-xl bg-ok-bg px-3.5 py-3 text-sm text-ok-fg">
                    {t('resetDone')}
                </p>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
                    <FormError message={error} />
                    <AuthField label={t('email')} name="email" type="email" autoComplete="email" required defaultValue={params.get('email') ?? ''} />
                    <AuthField label={t('code')} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required />
                    <AuthField
                        label={t('newPassword')}
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        placeholder={t('passwordPlaceholder')}
                    />
                    <button type="submit" disabled={busy} className={submitClass}>
                        {t('resetButton')}
                    </button>
                </form>
            )}
            <Link href="/auth/signin" className="text-sm font-medium">
                {t('back')}
            </Link>
        </>
    )
}

export default ResetPassword
