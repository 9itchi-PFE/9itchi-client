'use client'

import { useEffect, useRef, useState } from 'react'
import { countLabel } from '@/lib/badges'
import { cn } from '@/lib/cn'

// usePulse is true for a moment each time count goes up, so a new message catches the eye once.
export function usePulse(count: number) {
    const prev = useRef(count)
    const [on, setOn] = useState(false)
    useEffect(() => {
        const up = count > prev.current
        prev.current = count
        setOn(up)
        if (!up) return
        const id = setTimeout(() => setOn(false), 1800)
        return () => clearTimeout(id)
    }, [count])
    return on
}

// CountBadge is the red counter of an icon or a nav entry: nothing at 0, 9+ above 9.
export function CountBadge({ count, label, className }: { count: number; label: string; className?: string }) {
    const pulse = usePulse(count)
    if (count <= 0) return null
    return (
        <span role="img" aria-label={label} className={cn('relative inline-flex', className)}>
            {pulse ? <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-warn-fg opacity-60 motion-reduce:hidden" /> : null}
            <span className="relative min-w-[18px] rounded-full bg-warn-fg px-[5px] text-center text-[10.5px] font-bold leading-[18px] text-white">
                {countLabel(count)}
            </span>
        </span>
    )
}

// AttentionDot is the small dot on the avatar while something is waiting; count drives the pulse.
export function AttentionDot({ count, className }: { count: number; className?: string }) {
    const pulse = usePulse(count)
    if (count <= 0) return null
    return (
        <span aria-hidden="true" data-testid="attention-dot" className={cn('pointer-events-none absolute flex h-3 w-3', className)}>
            {pulse ? <span className="absolute inset-0 animate-ping rounded-full bg-warn-fg opacity-60 motion-reduce:hidden" /> : null}
            <span className="relative h-3 w-3 rounded-full border-2 border-white bg-warn-fg" />
        </span>
    )
}
