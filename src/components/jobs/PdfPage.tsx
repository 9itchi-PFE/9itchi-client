'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { Button } from '@/components/ui/Button'

// PdfSource is a PDF to read page by page: its address and, for one 9itchi keeps, the session token.
export type PdfSource = { url: string; token?: string }

let lib: Promise<typeof import('pdfjs-dist')> | null = null

// pdfjs loads pdf.js the first time a PDF is shown, with its worker (the page is drawn off the main thread).
function pdfjs() {
    lib ??= import('pdfjs-dist').then((m) => {
        m.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
        return m
    })
    return lib
}

// Documents opened in this tab, by address: going from one topic to the next reuses what was already read.
const docs = new Map<string, Promise<PDFDocumentProxy>>()

// openPdf reads a PDF in byte ranges (256 KB at a time, nothing fetched ahead): a page shows once the bytes it
// needs have arrived, instead of after the whole file (often 20 MB for a PFE book).
function openPdf(src: PdfSource): Promise<PDFDocumentProxy> {
    let doc = docs.get(src.url)
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
        doc.catch(() => docs.delete(src.url))
        docs.set(src.url, doc)
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
        docs.delete(source.url)
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
                <div
                    role="status"
                    className="flex aspect-[210/297] w-full flex-col items-center justify-center gap-3 bg-white p-6 text-center text-sm text-ink-3"
                >
                    <span aria-hidden className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-ink" />
                    <span>{loadingText}</span>
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
