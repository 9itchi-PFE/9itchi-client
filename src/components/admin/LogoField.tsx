'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CompanyBadge } from '@/components/jobs/OfferCard'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { logoUrl, useDeleteLogo, useLogos, useUploadLogo } from '@/hooks/useJobs'
import { apiError } from './SourcesScreen'

// LOGO_TYPES and LOGO_MAX are what job-api accepts: PNG, JPEG or WebP up to 2 MB (an SVG could carry a script).
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const LOGO_MAX = 2 * 1024 * 1024

// logoProblem says why a file cannot be a logo, before it is sent ('' when it can).
export function logoProblem(file: Pick<File, 'type' | 'size'>): '' | 'logoType' | 'logoTooBig' {
    if (!LOGO_TYPES.includes(file.type)) return 'logoType'
    if (file.size > LOGO_MAX) return 'logoTooBig'
    return ''
}

// LogoField sets the logo of a company, wherever its offers come from (a PFE book, a collected site, an offer
// typed by the team). One logo per company: every offer of that company shows it, else its initials.
export default function LogoField({ company }: { company: string }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const logos = useLogos()
    const upload = useUploadLogo()
    const remove = useDeleteLogo()
    const input = useRef<HTMLInputElement>(null)
    const [problem, setProblem] = useState('')
    const name = company.trim()
    const has = !!logoUrl(logos.data, name)

    const choose = (file: File | undefined) => {
        if (input.current) input.current.value = ''
        if (!file) return
        const p = logoProblem(file)
        if (p) return setProblem(t(p))
        setProblem('')
        upload.mutate(
            { company: name, file },
            { onSuccess: () => toast(t('logoSaved', { company: name })), onError: (e) => setProblem(apiError(e) ?? t('stateError')) },
        )
    }
    const drop = () =>
        remove.mutate(name, { onSuccess: () => toast(t('logoRemoved', { company: name })), onError: (e) => toast(apiError(e) ?? t('stateError')) })

    return (
        <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-line-soft bg-fill-3 px-4 py-3">
            <CompanyBadge company={name || '?'} size={52} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[14.5px] font-semibold">{t('logoTitle')}</span>
                <span className="text-[13px] leading-[1.45] text-ink-3">{name ? t('logoHint', { company: name }) : t('logoNoCompany')}</span>
                {problem ? (
                    <span role="alert" className="text-[13px] text-[#B42318]">
                        {problem}
                    </span>
                ) : null}
            </div>
            <input
                ref={input}
                type="file"
                accept={LOGO_TYPES.join(',')}
                className="hidden"
                aria-label={t('logoTitle')}
                onChange={(e) => choose(e.target.files?.[0])}
            />
            <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={!name || upload.isPending} onClick={() => input.current?.click()}>
                    {upload.isPending ? '…' : has ? t('logoChange') : t('logoAdd')}
                </Button>
                {has ? (
                    <Button type="button" variant="link" size="sm" className="text-ink-3" disabled={remove.isPending} onClick={drop}>
                        {t('logoRemove')}
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
