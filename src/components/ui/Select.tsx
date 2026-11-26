'use client'

import { Children, Fragment, isValidElement, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

type Choice = { value: string; label: ReactNode; text: string; disabled: boolean }
type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number }

export type SelectProps = {
    name?: string
    value?: string | number
    defaultValue?: string | number
    onChange?: (e: { target: { value: string; name: string } }) => void
    disabled?: boolean
    required?: boolean
    id?: string
    'aria-label'?: string
    // className styles the button; its look is the text field's, so a Select sits in a form like a Field.
    className?: string
    // The choices, written as <option value="…">label</option> (the label can hold an image or an icon).
    children: ReactNode
}

const MENU_MAX = 288
const MENU_MIN_WIDTH = 160
const GAP = 4
const EDGE = 8

const textOf = (node: ReactNode): string => {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(textOf).join('')
    if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
    return ''
}

// choicesOf reads the <option> elements given as children, through fragments and lists.
function choicesOf(children: ReactNode): Choice[] {
    const out: Choice[] = []
    Children.forEach(children, (c) => {
        if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(c)) return
        if (c.type === Fragment) out.push(...choicesOf(c.props.children))
        else if (c.type === 'option') {
            const text = textOf(c.props.children)
            out.push({ value: String(c.props.value ?? text), label: c.props.children, text, disabled: !!c.props.disabled })
        }
    })
    return out
}

function placeFor(trigger: HTMLElement, count: number): Place {
    const r = trigger.getBoundingClientRect()
    const width = Math.min(Math.max(r.width, MENU_MIN_WIDTH), window.innerWidth - 2 * EDGE)
    const rtl = getComputedStyle(trigger).direction === 'rtl'
    const left = Math.min(Math.max(rtl ? r.right - width : r.left, EDGE), window.innerWidth - width - EDGE)
    const below = window.innerHeight - r.bottom - GAP - EDGE
    const above = r.top - GAP - EDGE
    // Opens upward when the list does not fit below and there is more room above.
    if (below < Math.min(MENU_MAX, count * 44 + 12) && above > below) {
        return { left, width, bottom: window.innerHeight - r.top + GAP, maxHeight: Math.min(MENU_MAX, above) }
    }
    return { left, width, top: r.bottom + GAP, maxHeight: Math.min(MENU_MAX, below) }
}

// Select is the drop-down of the app: the same look as a text field, and a list in the style of the account menu,
// in place of the grey system list of a <select>. It is written like one (options as children, name, value or
// defaultValue, onChange(e.target.value)) and still sends its value with a form, through a hidden <select>.
// Keyboard: arrows, Home/End, Enter or Space to choose, Escape to close, letters to jump.
export function Select({ name, value, defaultValue, onChange, disabled, required, id, className, children, ...aria }: SelectProps) {
    const choices = choicesOf(children)
    const [inner, setInner] = useState<string | undefined>(defaultValue === undefined ? undefined : String(defaultValue))
    const current = value !== undefined ? String(value) : (inner ?? choices[0]?.value ?? '')
    const selected = choices.find((c) => c.value === current)
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const [place, setPlace] = useState<Place | null>(null)
    const trigger = useRef<HTMLButtonElement>(null)
    const list = useRef<HTMLDivElement>(null)
    const typed = useRef({ text: '', at: 0 })
    const listId = useId()

    const show = () => {
        if (disabled || open) return
        setActive(
            Math.max(
                0,
                choices.findIndex((c) => c.value === current),
            ),
        )
        setOpen(true)
        // Safari does not focus a button that is clicked: the keys need it there.
        trigger.current?.focus({ preventScroll: true })
    }
    const close = () => {
        setOpen(false)
        setPlace(null)
    }
    const pick = (c: Choice) => {
        if (c.disabled) return
        if (c.value !== current) {
            setInner(c.value)
            onChange?.({ target: { value: c.value, name: name ?? '' } })
        }
        close()
        trigger.current?.focus({ preventScroll: true })
    }

    useEffect(() => {
        if (!open || !trigger.current) return
        const move = () => trigger.current && setPlace(placeFor(trigger.current, choices.length))
        const outside = (e: PointerEvent) => {
            const t = e.target as Node
            // A click on the label around the button reaches the button next: it is not "outside".
            if (!trigger.current?.contains(t) && !list.current?.contains(t) && !trigger.current?.closest('label')?.contains(t)) close()
        }
        // The list follows its button when the page or the dialog scrolls, and goes when the button leaves the screen;
        // a scroll inside the list is only the list.
        const scrolled = (e: Event) => {
            if (list.current?.contains(e.target as Node) || !trigger.current) return
            const r = trigger.current.getBoundingClientRect()
            if (r.bottom < 0 || r.top > window.innerHeight) close()
            else move()
        }
        move()
        document.addEventListener('pointerdown', outside)
        window.addEventListener('resize', move)
        window.addEventListener('scroll', scrolled, true)
        return () => {
            document.removeEventListener('pointerdown', outside)
            window.removeEventListener('resize', move)
            window.removeEventListener('scroll', scrolled, true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, choices.length])

    useEffect(() => {
        if (open && place) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
    }, [open, place, active])

    const step = (from: number, by: 1 | -1) => {
        for (let i = from + by; i >= 0 && i < choices.length; i += by) if (!choices[i].disabled) return i
        return from
    }

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return
        const k = e.key
        if (k === 'Tab') return close()
        if (k === 'Escape') {
            if (!open) return
            e.preventDefault()
            // The dialog around the field closes on Escape too; this one is only for the list.
            e.stopPropagation()
            return close()
        }
        const arrow = k === 'ArrowDown' || k === 'ArrowUp'
        if (!open && (arrow || k === 'Enter' || k === ' ')) {
            e.preventDefault()
            return show()
        }
        const letter = k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
        if (!letter && !(open && (arrow || k === 'Home' || k === 'End' || k === 'Enter'))) return
        e.preventDefault()
        const base = open
            ? active
            : Math.max(
                  0,
                  choices.findIndex((c) => c.value === current),
              )
        if (!open) show()
        const typing = Date.now() - typed.current.at < 700 && typed.current.text !== ''
        if (k === 'ArrowDown') setActive(step(base, 1))
        else if (k === 'ArrowUp') setActive(step(base, -1))
        else if (k === 'Home') setActive(step(-1, 1))
        else if (k === 'End') setActive(step(choices.length, -1))
        else if ((k === 'Enter' || (k === ' ' && !typing)) && choices[active]) pick(choices[active])
        else if (letter) {
            typed.current = { text: (typing ? typed.current.text : '') + k.toLowerCase(), at: Date.now() }
            const word = typed.current.text
            // The same letter again goes to the next choice that starts with it.
            const from = word.length === 1 ? base + 1 : base
            const hit = Array.from(choices, (_, i) => (from + i) % choices.length).find(
                (i) => !choices[i].disabled && choices[i].text.toLowerCase().startsWith(word),
            )
            if (hit !== undefined) setActive(hit)
        }
    }

    return (
        <div className="relative">
            <button
                ref={trigger}
                type="button"
                id={id}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-activedescendant={open && place ? `${listId}-${active}` : undefined}
                aria-required={required || undefined}
                aria-label={aria['aria-label']}
                disabled={disabled}
                onClick={() => (open ? close() : show())}
                onKeyDown={onKeyDown}
                className={cn(
                    'box-border flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-line-strong bg-white px-3 text-start text-[15px] text-ink transition-colors',
                    'hover:border-ink-4 disabled:cursor-not-allowed disabled:bg-fill-3 disabled:text-ink-4',
                    open && 'border-ink hover:border-ink',
                    className,
                )}
            >
                <span className={cn('flex min-w-0 flex-1 items-center gap-2 truncate', current === '' && 'text-ink-4')}>{selected?.label}</span>
                <Icon name="chevron" size={16} className={cn('shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} aria-hidden />
            </button>
            {/* What the form sends and checks (required): the real value, behind the button. */}
            <select
                name={name}
                value={current}
                required={required}
                disabled={disabled}
                tabIndex={-1}
                aria-hidden
                onChange={() => undefined}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0 text-base"
            >
                {choices.map((c) => (
                    <option key={c.value} value={c.value} disabled={c.disabled}>
                        {c.text}
                    </option>
                ))}
            </select>
            {open && place
                ? createPortal(
                      <div
                          ref={list}
                          id={listId}
                          role="listbox"
                          style={{ position: 'fixed', left: place.left, top: place.top, bottom: place.bottom, width: place.width, maxHeight: place.maxHeight }}
                          // Keeps the focus on the button while the list is used.
                          onMouseDown={(e) => e.preventDefault()}
                          className="z-50 flex flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-1.5 shadow-nav"
                      >
                          {choices.map((c, i) => {
                              const on = c.value === current
                              return (
                                  <div
                                      key={c.value}
                                      id={`${listId}-${i}`}
                                      data-index={i}
                                      role="option"
                                      aria-selected={on}
                                      aria-disabled={c.disabled || undefined}
                                      onClick={() => pick(c)}
                                      onMouseMove={() => i !== active && !c.disabled && setActive(i)}
                                      className={cn(
                                          'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-2 sm:min-h-10',
                                          i === active && 'bg-fill text-ink',
                                          on && 'font-semibold text-ink',
                                          c.disabled && 'cursor-not-allowed opacity-50',
                                      )}
                                  >
                                      <span className="flex min-w-0 items-center gap-2">{c.label}</span>
                                      {on ? <Icon name="check" size={16} className="shrink-0 text-violet" aria-hidden /> : null}
                                  </div>
                              )
                          })}
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    )
}
