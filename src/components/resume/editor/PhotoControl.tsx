'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useMe } from '@/hooks/useAccount'
import { useSaveVersion } from '@/hooks/useResumes'
import AccountService from '@/services/AccountService'
import { errorStatus } from '@/services/ApiService'
import ResumeService from '@/services/ResumeService'
import ShowSwitch from './ShowSwitch'

const MAX_PHOTO = 2 * 1024 * 1024

// PhotoControl uploads, replaces or removes the CV photo (JPG or PNG, 2 MB).
export default function PhotoControl({
    resumeId,
    hasPhoto,
    photoUrl,
    onChanged,
    shown,
    onShown,
}: {
    resumeId: string
    hasPhoto: boolean
    photoUrl?: string | null
    onChanged: (has: boolean) => void
    shown: boolean
    onShown: (shown: boolean) => void
}) {
    const t = useTranslations('cv')
    const tc = useTranslations('common')
    const toast = useToast()
    const input = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)
    const snapshot = useSaveVersion(resumeId)
    const profileHasPhoto = !!useMe().data?.has_photo
    // fromProfile puts the profile photo on this CV (already square and under 2 MB).
    const fromProfile = async () => {
        setBusy(true)
        try {
            const blob = (await AccountService.getPhoto()).data
            setBusy(false)
            await upload(new File([blob], 'profile.jpg', { type: 'image/jpeg' }))
        } catch {
            toast(tc('error'))
            setBusy(false)
        }
    }
    const upload = async (f: File) => {
        if (!/^image\/(jpeg|png)$/.test(f.type)) return toast(t('photoType'))
        if (f.size > MAX_PHOTO) return toast(t('photoTooBig'))
        setBusy(true)
        try {
            await ResumeService.uploadPhoto(resumeId, f)
            onChanged(true)
            snapshot.mutate('photo_changed')
            toast(t('toastPhoto'))
        } catch (err) {
            const s = errorStatus(err)
            toast(s === 413 ? t('photoTooBig') : s === 400 ? t('photoType') : tc('error'))
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[13.5px] font-medium text-ink-2">{t('fields.photo')}</span>
            <div className="flex flex-wrap items-center gap-3">
                {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="h-14 w-14 rounded-full border-[1.5px] border-cv-blue object-cover" />
                ) : (
                    <span aria-hidden className="h-14 w-14 rounded-full border-[1.5px] border-dashed border-line-strong bg-fill-3" />
                )}
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
                    {hasPhoto ? t('fields.photoChange') : t('fields.photoAdd')}
                </Button>
                {!hasPhoto && profileHasPhoto ? (
                    <Button variant="link" size="sm" disabled={busy} onClick={fromProfile}>
                        {t('fields.photoFromProfile')}
                    </Button>
                ) : null}
                {hasPhoto ? (
                    <Button
                        variant="link"
                        size="sm"
                        disabled={busy}
                        className="text-ink-3 hover:text-warn-fg"
                        onClick={async () => {
                            await ResumeService.deletePhoto(resumeId)
                            onChanged(false)
                            toast(t('toastPhotoRemoved'))
                        }}
                    >
                        {t('fields.photoRemove')}
                    </Button>
                ) : null}
                <ShowSwitch shown={shown} label={t('style.showPhoto')} onChange={onShown} />
            </div>
            <span className="text-[13px] text-ink-3">{t('fields.photoHint')}</span>
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png"
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
