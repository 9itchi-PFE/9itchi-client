export type PdfState = 'ready' | 'loading' | 'error' | 'none'

// pdfState says what the PDF panel of a book shows: the PDF, a wait, a failure to retry, or (only when the company gave
// no PDF at all) nothing. A PDF 9itchi keeps (hasKept) is never « none »: while it is not here it is loading or failed.
export function pdfState({
    hostedUrl,
    hasKept,
    keptUrl,
    failed,
}: {
    hostedUrl?: string | null
    hasKept?: boolean
    keptUrl?: string
    failed?: boolean
}): PdfState {
    if (hostedUrl || keptUrl) return 'ready'
    if (!hasKept) return 'none'
    return failed ? 'error' : 'loading'
}

// megabytes writes a size in MB with one decimal, for the progress line of a long download.
export const megabytes = (bytes: number) => (bytes / 1_048_576).toFixed(1)
