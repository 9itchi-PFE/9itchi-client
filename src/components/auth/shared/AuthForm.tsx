'use client'

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Select, type SelectProps } from '@/components/ui/Select'
import { cn } from '@/lib/cn'

const control = 'box-border h-12 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] font-normal text-ink placeholder:text-ink-4'

// AuthField is the 48px field of the sign-in screen.
export const AuthField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string }>(function AuthField(
    { label, error, className, id, ...rest },
    ref,
) {
    const errId = error && id ? `${id}-err` : undefined
    return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-2">
            {label}
            <input
                ref={ref}
                id={id}
                dir="auto"
                aria-invalid={!!error}
                aria-describedby={errId}
                className={cn(control, error && 'border-warn-fg', className)}
                {...rest}
            />
            {error ? (
                <span id={errId} className="text-[13px] font-normal text-warn-fg">
                    {error}
                </span>
            ) : null}
        </label>
    )
})

export function AuthSelect({ label, children, className, ...rest }: SelectProps & { label: ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-2">
            {label}
            <Select className={cn('h-12 rounded-xl px-3.5 font-normal', className)} {...rest}>
                {children}
            </Select>
        </label>
    )
}

export function AuthHeading({ title, subtitle, switchLabel, switchHref }: { title: string; subtitle: string; switchLabel: string; switchHref: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-[30px] font-extrabold">{title}</h2>
            <p className="m-0 text-[15px] text-ink-3">
                {subtitle}{' '}
                <Link href={switchHref} className="hit font-semibold no-underline">
                    {switchLabel}
                </Link>
            </p>
        </div>
    )
}

const ssoClass =
    'flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-white text-[15px] font-semibold text-ink-2 no-underline hover:bg-fill-3 hover:text-ink-2'

// accountUrl is the public account-api address: Google and LinkedIn sign-in must reach it directly
// (its state cookie and callback live there, never behind the proxy).
const accountUrl = () => (process.env.NEXT_PUBLIC_ACCOUNT_API_BASE_URL ?? '').replace(/\/$/, '')

export function SsoButtons() {
    const t = useTranslations('auth')
    return (
        <>
            <div className="flex flex-col gap-2.5">
                <a href={`${accountUrl()}/auth/google`} className={ssoClass}>
                    <img src="/img/google.png" alt="" width={20} height={20} />
                    {t('google')}
                </a>
                {/* LinkedIn sign-in is hidden; account-api still serves /auth/linkedin. */}
            </div>
            <div className="flex items-center gap-3 text-[13px] text-ink-3">
                <span className="h-px flex-1 bg-line" />
                {t('or')}
                <span className="h-px flex-1 bg-line" />
            </div>
        </>
    )
}

export const submitClass =
    'mt-1 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[14px] border-0 bg-ink text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'

export function FormError({ message }: { message: string }) {
    if (!message) return null
    return (
        <p role="alert" className="m-0 rounded-xl bg-warn-bg px-3.5 py-3 text-sm text-warn-fg">
            {message}
        </p>
    )
}
