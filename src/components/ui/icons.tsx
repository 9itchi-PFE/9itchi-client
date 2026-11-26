import type { SVGProps } from 'react'

// Line icons drawn in the 9itchi canvas (24px grid, stroke 2).
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const paths = {
    briefcase: (
        <>
            <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
            <path d="M3 13h18" />
        </>
    ),
    file: (
        <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6M9 17h4" />
        </>
    ),
    send: (
        <>
            <path d="M22 2 11 13" />
            <path d="m22 2-7 20-4-9-9-4z" />
        </>
    ),
    // radar: concentric arcs around a dot (Recruiter Radar).
    radar: (
        <>
            <circle cx="12" cy="12" r="1.5" />
            <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4" />
            <path d="M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2" />
        </>
    ),
    bell: (
        <>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
            <path d="M10 20a2 2 0 0 0 4 0" />
        </>
    ),
    history: (
        <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    eye: (
        <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    eyeOff: (
        <>
            <path d="M17.9 17.9A10.7 10.7 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 4.1-5.1M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2" />
            <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" />
        </>
    ),
    trash: (
        <>
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
            <path d="M10 11v6M14 11v6" />
        </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    download: (
        <>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
        </>
    ),
    upload: (
        <>
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 21h14" />
        </>
    ),
    lock: (
        <>
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
    ),
    pencil: <path d="M4 20h4L19 9l-4-4L4 16z" />,
    link: (
        <>
            <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1" />
            <path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />
        </>
    ),
    check: <path d="m5 12 5 5 9-10" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </>
    ),
    pin: (
        <>
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
        </>
    ),
    money: (
        <>
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <circle cx="12" cy="12.5" r="2.5" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    place: <path d="M4 21V9l8-6 8 6v12" />,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
}

export type IconName = keyof typeof paths

// Bolt is the filled lime lightning of « Postuler en 1 clic ».
export function Bolt({ size = 17, className }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#D6F25E" aria-hidden="true" className={className}>
            <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
    )
}

export function Icon({ name, size = 17, ...rest }: IconProps & { name: IconName }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...rest}
        >
            {paths[name]}
        </svg>
    )
}
