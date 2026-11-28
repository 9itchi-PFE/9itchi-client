import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import SignIn from '@/components/auth/SignIn'
import { SsoButtons } from '@/components/auth/shared/AuthForm'
import fr from '../../messages/fr.json'

vi.mock('@/services/ApiService', () => ({ api: () => ({ get: vi.fn(), post: vi.fn() }) }))
const search = vi.hoisted(() => ({ value: '' }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }), useSearchParams: () => new URLSearchParams(search.value) }))

const render = (node: ReactNode) =>
    renderToStaticMarkup(
        <NextIntlClientProvider locale="fr" messages={fr} timeZone="Africa/Tunis">
            {node}
        </NextIntlClientProvider>,
    )

describe('Microsoft sign-in', () => {
    it('sits next to Google and goes to account-api /auth/microsoft', () => {
        const html = render(<SsoButtons />)
        expect(html).toContain('/auth/google')
        expect(html).toMatch(/href="[^"]*\/auth\/microsoft"/)
        expect(html).toContain(fr.auth.microsoft)
    })
    it('explains a failed Microsoft sign-in', () => {
        search.value = 'error=microsoft_failed'
        expect(render(<SignIn />)).toContain('Connexion Microsoft impossible')
        search.value = 'error=google_failed'
        expect(render(<SignIn />)).toContain('La connexion avec Google n’a pas marché')
    })
})
