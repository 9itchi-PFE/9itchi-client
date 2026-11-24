'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react'

const ToastContext = createContext<(message: string) => void>(() => {})

export const useToast = () => useContext(ToastContext)

// One toast at a time, bottom centre, lime dot (as in the canvas).
export function ToastProvider({ children }: PropsWithChildren) {
    const [message, setMessage] = useState('')
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const show = useCallback((m: string) => {
        setMessage(m)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setMessage(''), 3200)
    }, [])
    useEffect(() => () => clearTimeout(timer.current), [])
    return (
        <ToastContext.Provider value={show}>
            {children}
            <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-7 left-1/2 z-50 -translate-x-1/2">
                {message ? (
                    <div className="flex max-w-[520px] items-center gap-2.5 rounded-[14px] bg-ink px-[18px] py-3 text-sm font-medium text-white shadow-toast">
                        <span className="h-2 w-2 flex-none rounded-full bg-lime" />
                        {message}
                    </div>
                ) : null}
            </div>
        </ToastContext.Provider>
    )
}
