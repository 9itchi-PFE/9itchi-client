import type { Config } from 'tailwindcss'

// Design tokens from the 9itchi canvas (Main, CV, Import, CVCheck, Templates).
const config: Config = {
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: { DEFAULT: '#101218', 2: '#344054', 3: '#596070', 4: '#98A2B3' },
                lime: { DEFAULT: '#D6F25E', soft: '#E6F79A', deep: '#A9C23A' },
                violet: { DEFAULT: '#4B32E0', hover: '#3420B8', soft: '#EEEBFF', tint: '#F7F6FF' },
                ember: '#FF9A6B',
                page: '#FAFAF9',
                line: { DEFAULT: '#E4E7EC', soft: '#ECEEF1', strong: '#DADDE3', input: '#D0D5DD' },
                fill: { DEFAULT: '#F2F3F5', 2: '#F2F4F7', 3: '#F7F8FA' },
                ok: { bg: '#ECFDF3', fg: '#067647', dot: '#12B76A' },
                warn: { bg: '#FFF4ED', fg: '#C2410C', dot: '#F79009', line: '#F7C9A6' },
                cv: { blue: '#2F5597', pale: '#E8EDF5', navy: '#1F2A44' },
            },
            fontFamily: {
                sans: ['"Inter Variable"', '"Noto Sans Arabic Variable"', 'system-ui', 'sans-serif'],
                display: ['"Bricolage Grotesque Variable"', '"Noto Sans Arabic Variable"', 'sans-serif'],
                mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
                cv: ['"Source Sans 3 Variable"', '"Noto Sans Arabic Variable"', 'sans-serif'],
                cvserif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
            },
            boxShadow: {
                card: '5px 5px 0 #101218',
                pop: '6px 6px 0 #101218',
                nav: '0 1px 2px rgba(16,24,40,.05), 0 6px 16px rgba(16,24,40,.06)',
                paper: '0 1px 2px rgba(16,24,40,.05), 0 16px 40px rgba(16,24,40,.10)',
                toast: '0 12px 32px rgba(16,18,24,.3)',
            },
            letterSpacing: { tightish: '-0.02em' },
        },
    },
    plugins: [],
}

export default config
