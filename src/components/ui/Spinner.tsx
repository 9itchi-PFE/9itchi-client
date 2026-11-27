import { LogoMark } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'

// Spinner is the loading mark of the sign-in screen (AuthLoading): the logo inside two rings that leave it one
// after the other. The label is read by screen readers only; nothing is written on screen.
export function Spinner({ label, size = 44, className }: { label: string; size?: number; className?: string }) {
    return (
        <span
            role="status"
            aria-live="polite"
            className={cn('relative inline-grid flex-none place-items-center', className)}
            style={{ width: size, height: size }}
        >
            <span aria-hidden className="auth-ring absolute inset-0 rounded-full border border-lime-deep/50" />
            <span aria-hidden className="auth-ring auth-ring-late absolute inset-0 rounded-full border border-lime-deep/50" />
            <LogoMark size={Math.round(size * 0.6)} label="" />
            <span className="sr-only">{label}</span>
        </span>
    )
}

// PageSpinner fills a screen or a panel that has nothing to show yet.
export function PageSpinner({ label, size = 56, className }: { label: string; size?: number; className?: string }) {
    return (
        <div className={cn('flex w-full justify-center px-4 py-16', className)}>
            <Spinner label={label} size={size} />
        </div>
    )
}
