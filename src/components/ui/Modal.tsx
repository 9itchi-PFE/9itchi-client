'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'

function useDialog(open: boolean, onClose: () => void) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!open) return
        const prev = document.activeElement as HTMLElement | null
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        ref.current?.querySelector<HTMLElement>('button, a, input, textarea, select')?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            prev?.focus()
        }
    }, [open, onClose])
    return ref
}

export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
    const t = useTranslations('common')
    return (
        <button
            type="button"
            aria-label={t('close')}
            onClick={onClick}
            className={cn('flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-fill text-lg text-ink-2', className)}
        >
            ×
        </button>
    )
}

// Modal is the centred dialog of the canvas: ink border, hard shadow, 24px corners.
export function Modal({
    open,
    onClose,
    title,
    eyebrow,
    children,
    width = 480,
}: {
    open: boolean
    onClose: () => void
    title: ReactNode
    eyebrow?: ReactNode
    children: ReactNode
    width?: number
}) {
    const id = useId()
    const ref = useDialog(open, onClose)
    if (!open) return null
    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(16,18,24,.5)] p-6"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-labelledby={id}
                style={{ maxWidth: width }}
                className="relative flex max-h-full w-full flex-col overflow-y-auto gap-4 rounded-3xl border-[1.5px] border-ink bg-white p-8 shadow-pop"
            >
                <CloseButton onClick={onClose} className="absolute end-4 top-4" />
                {eyebrow ? <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3">{eyebrow}</span> : null}
                <h2 id={id} className="m-0 pe-6 text-[26px] font-extrabold leading-[1.15]">
                    {title}
                </h2>
                {children}
            </div>
        </div>
    )
}

// Drawer slides in from the end side (the versions panel of screen 4.1).
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
    const id = useId()
    const ref = useDialog(open, onClose)
    if (!open) return null
    return (
        <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(16,18,24,.35)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-labelledby={id}
                className="flex h-full w-[460px] max-w-full flex-col gap-[18px] overflow-auto bg-page p-[26px] shadow-[-16px_0_40px_rgba(16,18,24,.18)]"
            >
                <div className="flex items-center justify-between">
                    <h2 id={id} className="m-0 text-[26px] font-extrabold">
                        {title}
                    </h2>
                    <CloseButton onClick={onClose} />
                </div>
                {children}
            </aside>
        </div>
    )
}
