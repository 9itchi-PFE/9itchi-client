'use client'

import { useEffect, useId, useRef } from 'react'

// The 9itchi mark from the canvas: a lime page with a folded corner, drifting light inside and a
// slowly turning rim (15 s loop). Paused for people who ask for reduced motion.
export function LogoMark({ size = 32, label = '9itchi' }: { size?: number; label?: string }) {
    const p = useId().replace(/:/g, '') + 'lm'
    const ref = useRef<SVGSVGElement>(null)
    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            ref.current?.pauseAnimations?.()
        }
    }, [])
    return (
        <svg ref={ref} width={size} height={size} viewBox="-2 -2 36 36" role="img" aria-label={label} style={{ flex: 'none', overflow: 'visible' }}>
            <defs>
                <clipPath id={`${p}c`}>
                    <path d="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z">
                        <animate
                            attributeName="d"
                            dur="15s"
                            repeatCount="indefinite"
                            values="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z;M8.6 1.4h13.6l8.6 8.8v13.6a7.6 7.6 0 0 1-7.6 7.6H8.4a7.6 7.6 0 0 1-7.6-7.6V8.6a7.2 7.2 0 0 1 7.8-7.2z;M7.6 0.8h15.6l7.4 7.6v15.8a6.6 6.6 0 0 1-6.6 6.6H7.8a6.8 6.8 0 0 1-6.8-6.8V7.8a7 7 0 0 1 6.6-7z;M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                            calcMode="spline"
                            keyTimes="0;0.33;0.66;1"
                            keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                        />
                    </path>
                </clipPath>
                <radialGradient id={`${p}b`} cx="40%" cy="35%" r="75%">
                    <stop offset="0" stopColor="#E6F79A" />
                    <stop offset="1" stopColor="#D6F25E" />
                </radialGradient>
                <linearGradient id={`${p}r`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#A9C23A" />
                    <stop offset=".45" stopColor="#FF9A6B" />
                    <stop offset=".75" stopColor="#4B32E0" />
                    <stop offset="1" stopColor="#A9C23A" />
                    <animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="15s" repeatCount="indefinite" />
                </linearGradient>
                <filter id={`${p}s`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.2" />
                </filter>
                <filter id={`${p}t`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" />
                </filter>
                <filter id={`${p}g`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation=".8" />
                </filter>
            </defs>
            <g>
                <g clipPath={`url(#${p}c)`}>
                    <rect x="-4" y="-4" width="40" height="40" fill={`url(#${p}b)`} />
                    <g filter={`url(#${p}t)`}>
                        <ellipse cx="9" cy="24" rx="12" ry="6" fill="#FFFFFF" opacity=".7">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                values="0 16 16;120 16 16;250 16 16;360 16 16"
                                dur="15s"
                                repeatCount="indefinite"
                            />
                        </ellipse>
                        <ellipse cx="24" cy="9" rx="10" ry="5" fill="#8E7BFF" opacity=".25">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                values="360 16 16;220 16 16;100 16 16;0 16 16"
                                dur="15s"
                                repeatCount="indefinite"
                            />
                        </ellipse>
                    </g>
                    <g filter={`url(#${p}s)`}>
                        <ellipse cx="22" cy="26" rx="9" ry="3.2" fill="#FF9A6B" opacity=".35">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                values="-30 16 16;40 16 16;-80 16 16;-30 16 16"
                                dur="15s"
                                repeatCount="indefinite"
                                calcMode="spline"
                                keyTimes="0;0.33;0.66;1"
                                keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                            />
                        </ellipse>
                    </g>
                    <path d="M23 1v6a2 2 0 0 0 2 2h6z" fill="#A9C23A" opacity=".9">
                        <animate
                            attributeName="d"
                            dur="15s"
                            repeatCount="indefinite"
                            values="M23 1v6a2 2 0 0 0 2 2h6z;M22.2 1.4v6.6a2.2 2.2 0 0 0 2.2 2.2h6.4z;M23.2 0.8v5.4a2.2 2.2 0 0 0 2.2 2.2h5.2z;M23 1v6a2 2 0 0 0 2 2h6z"
                            calcMode="spline"
                            keyTimes="0;0.33;0.66;1"
                            keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                        />
                    </path>
                </g>
                <path
                    d="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                    fill="none"
                    stroke={`url(#${p}r)`}
                    strokeWidth="1.4"
                    opacity=".6"
                    filter={`url(#${p}g)`}
                >
                    <animate
                        attributeName="d"
                        dur="15s"
                        repeatCount="indefinite"
                        values="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z;M8.6 1.4h13.6l8.6 8.8v13.6a7.6 7.6 0 0 1-7.6 7.6H8.4a7.6 7.6 0 0 1-7.6-7.6V8.6a7.2 7.2 0 0 1 7.8-7.2z;M7.6 0.8h15.6l7.4 7.6v15.8a6.6 6.6 0 0 1-6.6 6.6H7.8a6.8 6.8 0 0 1-6.8-6.8V7.8a7 7 0 0 1 6.6-7z;M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                        calcMode="spline"
                        keyTimes="0;0.33;0.66;1"
                        keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                    />
                </path>
                <path d="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z" fill="none" stroke={`url(#${p}r)`} strokeWidth=".7">
                    <animate
                        attributeName="d"
                        dur="15s"
                        repeatCount="indefinite"
                        values="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z;M8.6 1.4h13.6l8.6 8.8v13.6a7.6 7.6 0 0 1-7.6 7.6H8.4a7.6 7.6 0 0 1-7.6-7.6V8.6a7.2 7.2 0 0 1 7.8-7.2z;M7.6 0.8h15.6l7.4 7.6v15.8a6.6 6.6 0 0 1-6.6 6.6H7.8a6.8 6.8 0 0 1-6.8-6.8V7.8a7 7 0 0 1 6.6-7z;M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                        calcMode="spline"
                        keyTimes="0;0.33;0.66;1"
                        keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                    />
                </path>
                <text x="15.6" y="23.6" textAnchor="middle" fontFamily="Bricolage Grotesque Variable, sans-serif" fontWeight="800" fontSize="21" fill="#101218">
                    9
                </text>
            </g>
        </svg>
    )
}

// Logo is the mark, the word and, unless tag is false, the PFE tag of the header.
export function Logo({ tag = true }: { tag?: boolean }) {
    return (
        <span className="flex items-center gap-2.5 text-ink">
            <LogoMark />
            <span className="font-display text-[21px] font-extrabold tracking-tightish">9itchi</span>
            {tag ? <span className="rounded-[5px] bg-ink px-1.5 py-[3px] font-mono text-[10.5px] font-semibold tracking-[.1em] text-lime">PFE</span> : null}
        </span>
    )
}

// LogoReading is the large mark of the reading screen (1.2b): lighter page, faster loop, gentle float.
export function LogoReading({ size = 150, label }: { size?: number; label: string }) {
    const p = useId().replace(/:/g, '') + 'lr'
    const ref = useRef<SVGSVGElement>(null)
    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ref.current?.pauseAnimations?.()
    }, [])
    return (
        <svg ref={ref} width={size} height={size} viewBox="-2 -2 36 36" role="img" aria-label={label} style={{ flex: 'none', overflow: 'visible' }}>
            <defs>
                <clipPath id={`${p}c`}>
                    <path d="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z">
                        <animate
                            attributeName="d"
                            dur="8s"
                            repeatCount="indefinite"
                            values="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z;M8.6 1.4h13.6l8.6 8.8v13.6a7.6 7.6 0 0 1-7.6 7.6H8.4a7.6 7.6 0 0 1-7.6-7.6V8.6a7.2 7.2 0 0 1 7.8-7.2z;M7.6 0.8h15.6l7.4 7.6v15.8a6.6 6.6 0 0 1-6.6 6.6H7.8a6.8 6.8 0 0 1-6.8-6.8V7.8a7 7 0 0 1 6.6-7z;M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                            calcMode="spline"
                            keyTimes="0;0.33;0.66;1"
                            keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                        />
                    </path>
                </clipPath>
                <radialGradient id={`${p}b`} cx="40%" cy="35%" r="75%">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#F4F9DD" />
                </radialGradient>
                <linearGradient id={`${p}r`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#D6F25E" />
                    <stop offset=".45" stopColor="#FF9A6B" />
                    <stop offset=".75" stopColor="#4B32E0" />
                    <stop offset="1" stopColor="#D6F25E" />
                    <animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="8s" repeatCount="indefinite" />
                </linearGradient>
                <filter id={`${p}s`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.6" />
                </filter>
                <filter id={`${p}t`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" />
                </filter>
                <filter id={`${p}g`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation=".8" />
                </filter>
            </defs>
            <g>
                <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0;0 -0.9;0 0"
                    dur="4.0s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyTimes="0;0.5;1"
                    keySplines=".45 0 .55 1;.45 0 .55 1"
                />
                <g clipPath={`url(#${p}c)`}>
                    <rect x="-4" y="-4" width="40" height="40" fill={`url(#${p}b)`} />
                    <g filter={`url(#${p}t)`}>
                        <ellipse cx="9" cy="24" rx="12" ry="6" fill="#D6F25E" opacity=".55">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                values="0 16 16;120 16 16;250 16 16;360 16 16"
                                dur="8s"
                                repeatCount="indefinite"
                            />
                        </ellipse>
                        <ellipse cx="24" cy="9" rx="10" ry="5" fill="#8E7BFF" opacity=".28">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                values="360 16 16;220 16 16;100 16 16;0 16 16"
                                dur="8s"
                                repeatCount="indefinite"
                            />
                        </ellipse>
                    </g>
                    <g filter={`url(#${p}s)`}>
                        <ellipse cx="22" cy="26" rx="9" ry="3.2" fill="#FF9A6B" opacity=".45">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                values="-30 16 16;40 16 16;-80 16 16;-30 16 16"
                                dur="8s"
                                repeatCount="indefinite"
                                calcMode="spline"
                                keyTimes="0;0.33;0.66;1"
                                keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                            />
                        </ellipse>
                    </g>
                    <path d="M-2 22C6 16 14 30 34 14" fill="none" stroke="#FF9A6B" strokeWidth=".9" strokeLinecap="round" opacity=".5">
                        <animate
                            attributeName="d"
                            dur="8s"
                            repeatCount="indefinite"
                            values="M-2 22C6 16 14 30 34 14;M-2 12C10 24 20 4 34 20;M-2 28C8 20 22 26 34 6;M-2 22C6 16 14 30 34 14"
                            calcMode="spline"
                            keyTimes="0;0.33;0.66;1"
                            keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                        />
                    </path>
                    <path d="M23 1v6a2 2 0 0 0 2 2h6z" fill="#C9E25A" opacity=".9">
                        <animate
                            attributeName="d"
                            dur="8s"
                            repeatCount="indefinite"
                            values="M23 1v6a2 2 0 0 0 2 2h6z;M22.2 1.4v6.6a2.2 2.2 0 0 0 2.2 2.2h6.4z;M23.2 0.8v5.4a2.2 2.2 0 0 0 2.2 2.2h5.2z;M23 1v6a2 2 0 0 0 2 2h6z"
                            calcMode="spline"
                            keyTimes="0;0.33;0.66;1"
                            keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                        />
                    </path>
                </g>
                <path
                    d="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                    fill="none"
                    stroke={`url(#${p}r)`}
                    strokeWidth="1.1"
                    opacity=".6"
                    filter={`url(#${p}g)`}
                >
                    <animate
                        attributeName="d"
                        dur="8s"
                        repeatCount="indefinite"
                        values="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z;M8.6 1.4h13.6l8.6 8.8v13.6a7.6 7.6 0 0 1-7.6 7.6H8.4a7.6 7.6 0 0 1-7.6-7.6V8.6a7.2 7.2 0 0 1 7.8-7.2z;M7.6 0.8h15.6l7.4 7.6v15.8a6.6 6.6 0 0 1-6.6 6.6H7.8a6.8 6.8 0 0 1-6.8-6.8V7.8a7 7 0 0 1 6.6-7z;M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                        calcMode="spline"
                        keyTimes="0;0.33;0.66;1"
                        keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                    />
                </path>
                <path d="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z" fill="none" stroke={`url(#${p}r)`} strokeWidth=".35">
                    <animate
                        attributeName="d"
                        dur="8s"
                        repeatCount="indefinite"
                        values="M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z;M8.6 1.4h13.6l8.6 8.8v13.6a7.6 7.6 0 0 1-7.6 7.6H8.4a7.6 7.6 0 0 1-7.6-7.6V8.6a7.2 7.2 0 0 1 7.8-7.2z;M7.6 0.8h15.6l7.4 7.6v15.8a6.6 6.6 0 0 1-6.6 6.6H7.8a6.8 6.8 0 0 1-6.8-6.8V7.8a7 7 0 0 1 6.6-7z;M8 1h15l8 8v15a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z"
                        calcMode="spline"
                        keyTimes="0;0.33;0.66;1"
                        keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"
                    />
                </path>
                <text x="15.6" y="23.6" textAnchor="middle" fontFamily="Bricolage Grotesque Variable, sans-serif" fontWeight="800" fontSize="21" fill="#101218">
                    9
                </text>
            </g>
        </svg>
    )
}
