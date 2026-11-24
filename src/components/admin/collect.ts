import type { JobEdit, ReviewJob, ReviewStatus, Source } from '@/types/job'

const HOUR = 3600_000

// When is how long ago a run or a proposal happened, as the canvas says it (« Il y a 2 h », « Hier, 03:00 »).
export type When =
    | { kind: 'never' }
    | { kind: 'minutes'; count: number }
    | { kind: 'hours'; count: number }
    | { kind: 'yesterday'; time: string }
    | { kind: 'date'; date: Date }

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export function when(iso: string | null, now = new Date()): When {
    if (!iso) return { kind: 'never' }
    const d = new Date(iso)
    const ms = Math.max(0, now.getTime() - d.getTime())
    if (ms < HOUR) return { kind: 'minutes', count: Math.max(1, Math.floor(ms / 60_000)) }
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (d >= startToday) return { kind: 'hours', count: Math.floor(ms / HOUR) }
    const startYesterday = new Date(startToday.getTime() - 24 * HOUR)
    if (d >= startYesterday) return { kind: 'yesterday', time: hhmm(d) }
    return { kind: 'date', date: d }
}

// SourceLook is the pill of the « État » column.
export type SourceLook = 'ok' | 'running' | 'idle' | 'off' | 'error'

export function sourceLook(s: Pick<Source, 'enabled' | 'state'>): SourceLook {
    if (s.state === 'running') return 'running'
    if (s.state === 'error') return 'error'
    if (!s.enabled) return 'off'
    return s.state === 'ok' ? 'ok' : 'idle'
}

// places reads the comma-separated cities of the source form.
export const places = (text: string) =>
    text
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 20)

// Status is the badge of an offer in the review queue: a passed deadline outranks « À vérifier ».
export type Status = ReviewStatus | 'expired'

export function status(j: { review_status: ReviewStatus; closes_on: string | null }, now = new Date()): Status {
    if (j.review_status === 'hidden') return 'hidden'
    if (j.closes_on) {
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        if (j.closes_on.slice(0, 10) < today) return 'expired'
    }
    return j.review_status
}

// Check is one line of « Vérifications automatiques »: the label key, and whether it passed.
export type Check = { key: string; ok: boolean }

// checks turns job-api's checks into the four lines of the canvas. The last one, « Rémunération, dates et ville
// remplies », also looks at the stipend and the city, and names the first thing missing.
export function checks(j: Pick<ReviewJob, 'checks' | 'stipend_tnd' | 'location' | 'work_mode'>): Check[] {
    const ok = (k: string) => j.checks.find((c) => c.key === k)?.ok ?? false
    const out: Check[] = [
        { key: ok('company_known') ? 'checkCompany' : 'checkCompanyNo', ok: ok('company_known') },
        { key: ok('deadline_not_passed') ? 'checkDeadline' : 'checkDeadlineNo', ok: ok('deadline_not_passed') },
        { key: ok('subject_and_skills') ? 'checkSubject' : 'checkSubjectNo', ok: ok('subject_and_skills') },
    ]
    if (!ok('start_date')) out.push({ key: 'missingStart', ok: false })
    else if (j.stipend_tnd === null) out.push({ key: 'missingPay', ok: false })
    else if (!j.location && j.work_mode !== 'remote') out.push({ key: 'missingCity', ok: false })
    else out.push({ key: 'checkFilled', ok: true })
    return out
}

// toEdit fills the « Modifier » form from an offer.
export function toEdit(j: ReviewJob): JobEdit {
    return {
        title: j.title,
        company: j.company,
        location: j.location ?? '',
        description: j.description ?? '',
        stipend_tnd: j.stipend_tnd,
        duration_months: j.duration_months,
        work_mode: j.work_mode ?? '',
        starts_on: j.starts_on?.slice(0, 10) ?? '',
        closes_on: j.closes_on?.slice(0, 10) ?? '',
        skills: j.skills ?? [],
        pair_ok: j.pair_ok,
        topic: j.topic ?? '',
        apply_email: j.apply_email ?? '',
    }
}

// number reads an optional whole number field: empty means not given.
export function number(v: string): number | null {
    const n = Number.parseInt(v, 10)
    return v.trim() === '' || Number.isNaN(n) ? null : n
}
