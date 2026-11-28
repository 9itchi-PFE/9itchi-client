'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import axios from 'axios'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import AuthService from '@/services/AuthService'
import { AuthField, FormError, submitClass } from '../shared/AuthForm'
import { landingPath } from '../shared/landing'
import AuthLoading from '../shared/AuthLoading'

// account-api sends at most one code a minute: the resend link waits as long.
const RESEND_WAIT_S = 60

// VerifyEmail asks for the 6-digit code account-api emailed at sign-up (or at a sign-in before the email was
// confirmed). The right code opens the session: a new account starts with its CV, others land as after a sign-in.
const VerifyEmail = () => {
    const t = useTranslations('auth')
    const router = useRouter()
    const params = useSearchParams()
    const given = params.get('email') ?? ''
    const isNew = params.get('new') === '1'
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [busy, setBusy] = useState(false)
    const [opening, setOpening] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const [wait, setWait] = useState(given ? RESEND_WAIT_S : 0)

    useEffect(() => {
        if (wait <= 0) return
        const id = setTimeout(() => setWait((s) => s - 1), 1000)
        return () => clearTimeout(id)
    }, [wait])

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const email = String(f.get('email') ?? '').trim()
        const code = String(f.get('code') ?? '').trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('errEmail'))
        if (!/^\d{6}$/.test(code)) return setError(t('errCode'))
        setBusy(true)
        setError('')
        setNotice('')
        try {
            const { data } = await AuthService.verifyEmail({ email, code })
            const res = await signIn('tokens', { access_token: data.access_token, refresh_token: data.refresh_token, redirect: false })
            if (!res || res.error) throw new Error('sign-in after verification')
            setOpening(true)
            // A new student starts with the CV (screen 1.2).
            router.replace(isNew ? '/resumes/upload' : await landingPath(params.get(REDIRECT_URL_KEY)))
        } catch (err) {
            const status = axios.isAxiosError(err) ? err.response?.status : undefined
            setError(status === 400 ? t('errCode') : status === 403 ? t('errSuspended') : t('errGeneric'))
            setBusy(false)
        }
    }

    const resend = async (form: HTMLFormElement | null) => {
        const email = String(new FormData(form ?? undefined).get('email') ?? '').trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('errEmail'))
        setError('')
        try {
            await AuthService.resendVerification(email)
            setNotice(t('verifyResent'))
            setWait(RESEND_WAIT_S)
        } catch {
            setError(t('errGeneric'))
        }
    }

    if (opening) return <AuthLoading title={isNew ? t('signupOpening') : t('callback')} text={isNew ? t('signupOpeningText') : t('callbackText')} />
    return (
        <>
            <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-[30px] font-extrabold">{t('verifyTitle')}</h2>
                <p className="m-0 text-[15px] leading-normal text-ink-3">
                    {given
                        ? t.rich('verifyText', { email: given, b: (c) => <strong className="break-all font-semibold text-ink">{c}</strong> })
                        : t('verifyTextNoEmail')}
                </p>
            </div>
            {notice ? (
                <p role="status" className="m-0 rounded-xl bg-ok-bg px-3.5 py-3 text-sm text-ok-fg">
                    {notice}
                </p>
            ) : null}
            <form ref={formRef} onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
                <FormError message={error} />
                <AuthField
                    label={t('email')}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    defaultValue={given}
                    readOnly={!!given}
                    placeholder={t('emailPlaceholder')}
                />
                <AuthField
                    label={t('code')}
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    autoFocus={!!given}
                    className="text-center font-mono text-[22px] tracking-[0.4em]"
                />
                <button type="submit" disabled={busy} className={submitClass}>
                    {busy ? t('verifying') : t('verifyButton')}
                </button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                <Link href="/auth/signin" className="hit">
                    {t('back')}
                </Link>
                <button
                    type="button"
                    disabled={wait > 0}
                    onClick={() => resend(formRef.current)}
                    className="hit cursor-pointer border-0 bg-transparent p-0 font-medium text-ink underline disabled:cursor-default disabled:text-ink-4 disabled:no-underline"
                >
                    {wait > 0 ? t('verifyResendIn', { seconds: wait }) : t('verifyResend')}
                </button>
            </div>
        </>
    )
}

export default VerifyEmail
