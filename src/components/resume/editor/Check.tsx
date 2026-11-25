import type { ReactNode } from 'react'

// Check is the one checkbox of the editor: same size, radius and focus ring everywhere.
export function Check({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
    return (
        <label className="group flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink-2">
            <span className="relative flex h-[20px] w-[20px] flex-none">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer h-full w-full cursor-pointer appearance-none rounded-[6px] border border-line-strong bg-white transition-colors checked:border-ink checked:bg-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                />
                <svg
                    viewBox="0 0 20 20"
                    aria-hidden
                    className="pointer-events-none absolute inset-0 hidden h-full w-full fill-none stroke-white peer-checked:block"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m5.5 10.5 3 3 6-7" />
                </svg>
            </span>
            {children}
        </label>
    )
}
