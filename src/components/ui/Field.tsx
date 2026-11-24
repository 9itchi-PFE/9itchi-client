import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const inputClass = 'h-11 w-full rounded-[10px] border border-line-strong bg-white px-3 text-[15px] text-ink placeholder:text-ink-4 box-border'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }

// Field is a label above its input (the editor of screen 4.1).
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, className, ...rest }, ref) {
    return (
        <label className="flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
            {label}
            <input ref={ref} dir="auto" className={cn(inputClass, className)} {...rest} />
        </label>
    )
})

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...rest }, ref) {
    return (
        <textarea
            ref={ref}
            dir="auto"
            className={cn(
                'box-border w-full resize-y rounded-xl border border-line-strong px-3.5 py-3 text-[15px] leading-[1.55] text-ink focus:border-[1.5px] focus:border-ink',
                className,
            )}
            {...rest}
        />
    )
})
