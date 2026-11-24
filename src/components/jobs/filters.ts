import type { JobQuery, Tab } from '@/types/job'
import { TOPICS, type Topic, type WorkMode } from '@/types/preferences'

// Filters are the offers screen state, kept in the URL so a search can be shared, reloaded or linked to.
export type Filters = {
    tab: Tab
    q: string
    location: string
    paid: boolean
    flexible: boolean
    easy: boolean
    pair: boolean
    topic?: Topic
    length?: number
    start?: string
    mode?: WorkMode
}

export const defaultFilters: Filters = { tab: 'for_you', q: '', location: '', paid: false, flexible: false, easy: false, pair: false }

const TABS: Tab[] = ['for_you', 'all', 'saved']
const MODES: WorkMode[] = ['on_site', 'hybrid', 'remote']

type Params = { get(name: string): string | null }

// fromSearch reads the filters from the URL; unknown values are ignored.
export function fromSearch(p: Params): Filters {
    const tab = p.get('tab') as Tab
    const topic = p.get('topic') as Topic
    const mode = p.get('mode') as WorkMode
    const length = Number(p.get('length'))
    const start = p.get('start') ?? ''
    return {
        tab: TABS.includes(tab) ? tab : 'for_you',
        q: (p.get('q') ?? '').slice(0, 200),
        location: (p.get('where') ?? '').slice(0, 200),
        paid: p.get('paid') === '1',
        flexible: p.get('flexible') === '1',
        easy: p.get('easy') === '1',
        pair: p.get('pair') === '1',
        topic: TOPICS.includes(topic) ? topic : undefined,
        length: Number.isInteger(length) && length >= 1 && length <= 12 ? length : undefined,
        start: /^\d{4}-(0[1-9]|1[0-2])$/.test(start) ? start : undefined,
        mode: MODES.includes(mode) ? mode : undefined,
    }
}

// toSearch writes the filters back as a query string ('' when everything is default).
export function toSearch(f: Filters): string {
    const p = new URLSearchParams()
    if (f.tab !== 'for_you') p.set('tab', f.tab)
    if (f.q.trim()) p.set('q', f.q.trim())
    if (f.location.trim()) p.set('where', f.location.trim())
    for (const k of ['paid', 'flexible', 'easy', 'pair'] as const) if (f[k]) p.set(k, '1')
    if (f.topic) p.set('topic', f.topic)
    if (f.length) p.set('length', String(f.length))
    if (f.start) p.set('start', f.start)
    if (f.mode) p.set('mode', f.mode)
    const s = p.toString()
    return s ? `?${s}` : ''
}

// toJobQuery is what GET /jobs needs for these filters; with CV skills the closest offers come first.
// The saved tab is a bookmark list: it always shows every saved offer, whatever the search.
export function toJobQuery(f: Filters, skills: string[], tab: Tab = f.tab): JobQuery {
    const sort = skills.length ? 'match' : f.q.trim() && tab !== 'saved' ? 'relevance' : 'date'
    if (tab === 'saved') return { tab, skill: skills.length ? skills.slice(0, 50) : undefined, sort }
    return {
        tab,
        q: f.q.trim() || undefined,
        location: f.location.trim() || undefined,
        paid: f.paid,
        flexible: f.flexible,
        easy_apply: f.easy,
        pair_ok: f.pair,
        topic: f.topic,
        duration_months: f.length,
        start_month: f.start,
        work_mode: f.mode,
        skill: skills.length ? skills.slice(0, 50) : undefined,
        sort,
    }
}

// searching is true when the student typed a search (the header then counts its results instead of all offers).
export const searching = (f: Filters) => !!(f.q.trim() || f.location.trim())

export type RelaxKey = 'relaxPlace' | 'relaxPaid' | 'relaxFlexible' | 'relaxEasy' | 'relaxPair' | 'relaxLength' | 'relaxStart' | 'relaxTopic' | 'relaxMode'

// relaxations lists, for each active filter but the query, the same search without it (empty search screen).
export function relaxations(f: Filters): { key: RelaxKey; filters: Filters }[] {
    const out: { key: RelaxKey; filters: Filters }[] = []
    if (f.location.trim()) out.push({ key: 'relaxPlace', filters: { ...f, location: '' } })
    if (f.paid) out.push({ key: 'relaxPaid', filters: { ...f, paid: false } })
    if (f.flexible) out.push({ key: 'relaxFlexible', filters: { ...f, flexible: false } })
    if (f.easy) out.push({ key: 'relaxEasy', filters: { ...f, easy: false } })
    if (f.pair) out.push({ key: 'relaxPair', filters: { ...f, pair: false } })
    if (f.length) out.push({ key: 'relaxLength', filters: { ...f, length: undefined } })
    if (f.start) out.push({ key: 'relaxStart', filters: { ...f, start: undefined } })
    if (f.topic) out.push({ key: 'relaxTopic', filters: { ...f, topic: undefined } })
    if (f.mode) out.push({ key: 'relaxMode', filters: { ...f, mode: undefined } })
    return out
}

// filtered is true when anything narrows the list beyond the tab.
export const filtered = (f: Filters) => relaxations(f).length > 0 || !!f.q.trim()
