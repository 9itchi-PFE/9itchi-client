'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import { landingPath } from '../shared/landing'

// OAuthCallback receives the tokens account-api puts in the URL fragment after Google or LinkedIn
// (the fragment never reaches a server log), removes them from the address bar and opens the session.
const OAuthCallback = () => {
    const t = useTranslations('auth')
    const router = useRouter()
    const done = useRef(false)
    useEffect(() => {
        if (done.current) return
        done.current = true
        const hash = new URLSearchParams(window.location.hash.slice(1))
        window.history.replaceState(null, '', window.location.pathname)
        const access = hash.get('access_token')
        const refresh = hash.get('refresh_token')
        if (!access || !refresh) return router.replace('/auth/signin?error=google_failed')
        ;(async () => {
            const res = await signIn('tokens', { access_token: access, refresh_token: refresh, redirect: false })
            if (!res || res.error) return router.replace('/auth/signin?error=google_failed')
            router.replace(await landingPath(null))
        })()
    }, [router])
    return (
        <p role="status" className="m-0 text-center text-[15px] text-ink-3">
            {t('callback')}
        </p>
    )
}

export default OAuthCallback
