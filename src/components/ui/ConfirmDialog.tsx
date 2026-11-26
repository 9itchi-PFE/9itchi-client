'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from './Button'
import { Modal } from './Modal'

// ConfirmDialog asks before an action that students or the team would notice, in the app's own dialog (styled,
// RTL-aware, testable) instead of window.confirm. Cancel is focused first, so Enter never confirms by accident.
export function ConfirmDialog({
    open,
    title,
    children,
    confirmLabel,
    cancelLabel,
    busy,
    onConfirm,
    onClose,
}: {
    open: boolean
    title: ReactNode
    children: ReactNode
    confirmLabel: ReactNode
    // cancelLabel replaces « Annuler » where that word would read as the action itself (stopping a subscription).
    cancelLabel?: ReactNode
    busy?: boolean
    onConfirm: () => void
    onClose: () => void
}) {
    const t = useTranslations('common')
    return (
        <Modal open={open} onClose={onClose} title={title}>
            <div role="alertdialog" className="flex flex-col gap-5">
                <p className="m-0 text-[14.5px] leading-[1.55] text-ink-2">{children}</p>
                <div className="flex flex-wrap justify-end gap-2.5">
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        {cancelLabel ?? t('cancel')}
                    </Button>
                    <Button onClick={onConfirm} disabled={busy}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
