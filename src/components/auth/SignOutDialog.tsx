'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// SignOutDialog asks before signing out. It is drawn on the body: the headers that open it are sticky and blurred,
// which would otherwise hold a fixed dialog inside them.
export function SignOutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const t = useTranslations('common')
    const [leaving, setLeaving] = useState(false)
    if (!open || typeof document === 'undefined') return null
    return createPortal(
        <ConfirmDialog
            open
            title={t('signOutTitle')}
            confirmLabel={t('signOutYes')}
            busy={leaving}
            onConfirm={() => {
                setLeaving(true)
                signOut()
            }}
            onClose={onClose}
        >
            {t('signOutText')}
        </ConfirmDialog>,
        document.body,
    )
}
