export type ResumeSlots = { used: number; limit: number | null; full: boolean; isFree: boolean }

// resumeSlots reads how many CVs the plan allows: a missing `resumes` quota is unlimited.
export function resumeSlots(total: number, quotas: Record<string, number> | undefined, isFree: boolean): ResumeSlots {
    const q = quotas?.resumes
    const limit = typeof q === 'number' ? q : null
    return { used: total, limit, full: limit !== null && total >= limit, isFree }
}

export type UploadFailure = 'size' | 'type' | 'quota' | 'full' | 'other'

// uploadFailure maps the answer of POST /resumes/upload: a 402 is the paywall (free plan) or the plan's CV limit (paid).
export function uploadFailure(status: number | undefined, isFree: boolean): UploadFailure {
    if (status === 413) return 'size'
    if (status === 400) return 'type'
    if (status === 402) return isFree ? 'quota' : 'full'
    return 'other'
}
