import { Fragment, type ReactNode } from 'react'

// Descriptions keep their formatting as light inline marks: **bold**, *italic*, __underline__ and [text](https://link).
const MARKS = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g

export function Rich({ text }: { text: string }): ReactNode {
    return (
        <>
            {text.split(MARKS).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
                if (part.startsWith('__') && part.endsWith('__') && part.length > 4) return <u key={i}>{part.slice(2, -2)}</u>
                if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
                const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part)
                if (link)
                    return (
                        <a key={i} data-cv="link" href={link[2]} target="_blank" rel="noopener noreferrer" className="text-inherit underline">
                            {link[1]}
                        </a>
                    )
                return <Fragment key={i}>{part}</Fragment>
            })}
        </>
    )
}

// wrap puts marks around the selected text (or an empty pair when nothing is selected) and returns the new text and caret.
export function wrap(value: string, start: number, end: number, open: string, close = open): { text: string; caret: number } {
    const text = value.slice(0, start) + open + value.slice(start, end) + close + value.slice(end)
    return { text, caret: end + open.length + (start === end ? 0 : close.length) }
}
