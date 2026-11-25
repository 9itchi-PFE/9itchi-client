'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useProfilePhoto, useSetProfilePhoto } from '@/hooks/useAccount'
import { errorStatus } from '@/services/ApiService'

export const MAX_PROFILE_PHOTO = 5 * 1024 * 1024

// ProfilePhoto adds, replaces or removes the profile photo (JPG or PNG, 5 MB). It is saved at once, apart from the form.
export default function ProfilePhoto({ hasPhoto }: { hasPhoto: boolean }) {
    const t = useTranslations('settings')
    const tc = useTranslations('common')
    const toast = useToast()
    const input = useRef<HTMLInputElement>(null)
    const url = useProfilePhoto(hasPhoto).data
    const set = useSetProfilePhoto()
    const upload = (f: File) => {
        if (!/^image\/(jpeg|png)$/.test(f.type)) return toast(t('photoType'))
        if (f.size > MAX_PROFILE_PHOTO) return toast(t('photoTooBig'))
        set.mutate(f, {
            onSuccess: () => toast(t('photoSaved')),
            onError: (err) => {
                const s = errorStatus(err)
                toast(s === 413 ? t('photoTooBig') : s === 400 ? t('photoType') : tc('error'))
            },
        })
    }
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[13.5px] font-medium text-ink-2">{t('photo')}</span>
            <div className="flex flex-wrap items-center gap-3">
                {hasPhoto && url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={t('photoAlt')} className="h-14 w-14 rounded-full border-[1.5px] border-violet object-cover" />
                ) : (
                    <span aria-hidden className="h-14 w-14 rounded-full border-[1.5px] border-dashed border-line-strong bg-fill-3" />
                )}
                <Button variant="secondary" size="sm" disabled={set.isPending} onClick={() => input.current?.click()}>
                    {hasPhoto ? t('photoChange') : t('photoAdd')}
                </Button>
                {hasPhoto ? (
                    <Button
                        variant="link"
                        size="sm"
                        disabled={set.isPending}
                        className="text-ink-3 hover:text-warn-fg"
                        onClick={() => set.mutate(null, { onSuccess: () => toast(t('photoRemoved')), onError: () => toast(tc('error')) })}
                    >
                        {t('photoRemove')}
                    </Button>
                ) : null}
            </div>
            <span className="text-[12.5px] text-ink-3">{t('photoHint')}</span>
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png"
                aria-label={t('photo')}
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) upload(f)
                }}
            />
        </div>
    )
}
