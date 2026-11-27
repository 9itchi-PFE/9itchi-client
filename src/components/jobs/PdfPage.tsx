'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

// PdfSource is a PDF to read page by page: its address and, for one 9itchi keeps, the session token.
export type PdfSource = { url: string; token?: string }

// pdf.js 4 calls Promise.withResolvers (Safari 17.4, Chrome 119, Firefox 121). Older phones get this stand-in. It
// refers to nothing outside itself, so its source can also go in front of pdf.js' worker, which runs in its own thread.
function polyfillWithResolvers() {
    const P = Promise as unknown as { withResolvers?: unknown }
    if (typeof P.withResolvers === 'function') return
    P.withResolvers = function () {
        let resolve!: (value: unknown) => void
        let reject!: (reason: unknown) => void
        const promise = new Promise((res, rej) => {
            resolve = res
            reject = rej
        })
        return { promise, resolve, reject }
    }
}

let lib: Promise<typeof import('pdfjs-dist')> | null = null

// pdfjs loads pdf.js the first time a PDF is shown, with its worker (the page is drawn off the main thread).
function pdfjs() {
    lib ??= import('pdfjs-dist').then((m) => {
        const worker = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
        if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers === 'function') {
            m.GlobalWorkerOptions.workerSrc = worker
        } else {
            polyfillWithResolvers()
            const wrapper = new Blob([`(${polyfillWithResolvers.toString()})();import ${JSON.stringify(new URL(worker, location.href).href)};`], {
                type: 'text/javascript',
            })
            m.GlobalWorkerOptions.workerSrc = URL.createObjectURL(wrapper)
        }
        return m
    })
    return lib
}

// Documents opened in this tab: going from one topic to the next reuses what was already read. A document keeps the
// session token it was opened with, which lives 15 minutes, so the token is part of the key; only the last few are
// kept, older ones are released.
const docs = new Map<string, Promise<PDFDocumentProxy>>()
const KEPT = 3
const docKey = (src: PdfSource) => `${src.url}|${src.token ?? ''}`

// openPdf reads a PDF in byte ranges (256 KB at a time, nothing fetched ahead): a page shows once the bytes it
// needs have arrived, instead of after the whole file (often 20 MB for a PFE book).
function openPdf(src: PdfSource): Promise<PDFDocumentProxy> {
    const key = docKey(src)
    let doc = docs.get(key)
    if (!doc) {
        doc = pdfjs().then(
            (m) =>
                m.getDocument({
                    url: src.url,
                    httpHeaders: src.token ? { Authorization: `Bearer ${src.token}` } : undefined,
                    rangeChunkSize: 256 * 1024,
                    disableAutoFetch: true,
                    disableStream: true,
                    isEvalSupported: false,
                }).promise,
        )
        doc.catch(() => docs.delete(key))
        docs.set(key, doc)
        while (docs.size > KEPT) {
            const [oldest] = docs.keys()
            docs.get(oldest)
                ?.then((d) => d.destroy())
                .catch(() => undefined)
            docs.delete(oldest)
        }
    }
    return doc
}

type Props = {
    source: PdfSource
    page: number
    label: string
    loadingText: string
    errorText: string
    retryText: string
    // onPages tells how many pages the PDF has, once it is open.
    onPages?: (total: number) => void
}

// PdfPage draws one page of a PDF at the width it is given, sharp on any screen (a phone, a tablet, a computer).
// It works where an <iframe> does not: on an iPad an iframe shows the first page whatever page is asked for.
export default function PdfPage({ source, page, label, loadingText, errorText, retryText, onPages }: Props) {
    const box = useRef<HTMLDivElement>(null)
    const canvas = useRef<HTMLCanvasElement>(null)
    const [width, setWidth] = useState(0)
    const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
    const [attempt, setAttempt] = useState(0)
    // The render in flight: a page asked for while another still draws waits for it, so two renders never share the canvas.
    const drawing = useRef<Promise<unknown>>(Promise.resolve())

    useEffect(() => {
        const el = box.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (!width) return
        let task: RenderTask | undefined
        let stop = false
        setState('loading')
        openPdf(source)
            .then(async (doc) => {
                if (stop) return
                onPages?.(doc.numPages)
                const p = await doc.getPage(Math.min(Math.max(1, page), doc.numPages))
                await drawing.current
                if (stop || !canvas.current) return
                const base = p.getViewport({ scale: 1 })
                const ratio = window.devicePixelRatio || 1
                const viewport = p.getViewport({ scale: (width / base.width) * ratio })
                const c = canvas.current
                c.width = Math.floor(viewport.width)
                c.height = Math.floor(viewport.height)
                c.style.width = `${width}px`
                c.style.height = `${Math.floor(viewport.height / ratio)}px`
                task = p.render({ canvasContext: c.getContext('2d')!, viewport })
                drawing.current = task.promise.catch(() => undefined)
                await task.promise
                if (!stop) setState('ready')
            })
            .catch((err: unknown) => {
                if (stop || (err as { name?: string })?.name === 'RenderingCancelledException') return
                setState('error')
            })
        return () => {
            stop = true
            task?.cancel()
        }
        // onPages is a callback from the parent: a new one each render must not draw the page again.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source.url, source.token, page, width, attempt])

    const retry = () => {
        docs.delete(docKey(source))
        setAttempt((a) => a + 1)
    }

    return (
        <div ref={box} className="relative w-full">
            <canvas
                ref={canvas}
                role="img"
                aria-label={label}
                className={state === 'ready' ? 'block bg-white shadow-[0_2px_8px_rgba(16,24,40,.12)]' : 'hidden'}
            />
            {state === 'loading' ? (
                <div className="flex aspect-[210/297] w-full flex-col items-center justify-center gap-3 bg-white p-6 text-center text-sm text-ink-3">
                    {/* The spinner is the status region: a second one around it would be announced twice. */}
                    <Spinner label={loadingText} size={56} />
                </div>
            ) : null}
            {state === 'error' ? (
                <div
                    role="alert"
                    className="flex aspect-[210/297] w-full flex-col items-center justify-center gap-3 bg-white p-6 text-center text-sm text-ink-3"
                >
                    <span>{errorText}</span>
                    <Button variant="secondary" size="sm" onClick={retry}>
                        {retryText}
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
