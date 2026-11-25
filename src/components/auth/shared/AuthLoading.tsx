import { LogoMark } from '@/components/ui/Logo'

// AuthLoading is what the student sees while the session opens (after Google or LinkedIn, and after the
// form is accepted): the mark inside two slow rings, a line saying what happens and a bar that keeps moving.
const AuthLoading = ({ title, text }: { title: string; text?: string }) => (
    <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-6 py-10 text-center max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:bg-page"
    >
        <span className="relative grid h-[104px] w-[104px] place-items-center">
            <span aria-hidden className="auth-ring absolute inset-0 rounded-full border border-lime-deep/50" />
            <span aria-hidden className="auth-ring auth-ring-late absolute inset-0 rounded-full border border-lime-deep/50" />
            <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-[0_8px_24px_rgba(16,18,24,0.08)]">
                <LogoMark size={40} label="" />
            </span>
        </span>
        <div className="flex flex-col gap-1.5">
            <p className="m-0 font-display text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-ink">{title}</p>
            {text && <p className="m-0 text-[15px] leading-normal text-ink-3">{text}</p>}
        </div>
        <span aria-hidden className="relative h-1 w-40 overflow-hidden rounded-full bg-ink/10">
            <span className="auth-bar absolute inset-y-0 w-2/5 rounded-full bg-ink" />
        </span>
    </div>
)

export default AuthLoading
