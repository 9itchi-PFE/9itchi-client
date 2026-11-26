import Link from 'next/link'
import type { ButtonHTMLAttributes, ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link' | 'dashed'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
    primary: 'bg-ink text-white hover:bg-black border-0',
    secondary: 'border border-line-strong bg-white text-ink shadow-[0_1px_0_rgba(16,24,40,.04)] hover:bg-fill-3',
    ghost: 'border-0 bg-fill text-ink-2 hover:bg-line-soft',
    link: 'hit border-0 bg-transparent px-0 text-violet hover:text-violet-hover',
    dashed: 'border border-dashed border-[#C9CDD5] bg-transparent text-ink-2 hover:bg-white',
}
const sizes: Record<Size, string> = {
    sm: 'h-9 rounded-[10px] px-3.5 text-[13.5px] font-semibold',
    md: 'h-[42px] rounded-[12px] px-[18px] text-sm font-semibold',
    lg: 'h-[52px] rounded-[14px] px-6 text-[15.5px] font-semibold',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
    cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size],
        variants[variant],
        variant === 'link' && 'h-auto',
        className,
    )

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }

export function Button({ variant, size, className, type = 'button', ...rest }: Props) {
    return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}

export function ButtonLink({ variant, size, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
    return <Link className={buttonClass(variant, size, cn(variant === 'primary' && 'text-white hover:text-white', className))} {...rest} />
}
