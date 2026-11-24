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
}

export type IconName = keyof typeof paths

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
