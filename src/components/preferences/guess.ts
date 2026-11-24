import type { ResumeContent } from '@/types/resume'
import type { Preferences, Topic } from '@/types/preferences'

// What screen 1.3 reads from the CV before asking: topics from the skills and projects, skills, the city,
// and the start month and length from the headline (« Stage PFE de 6 mois dès février 2027 »).

const topicWords: Record<Topic, string[]> = {
    embedded: ['embarqué', 'embedded', 'c++', 'arduino', 'stm32', 'rtos', 'microcontr', 'fpga', 'iot', 'nfc'],
    web: ['react', 'angular', 'vue', 'javascript', 'typescript', 'node', 'html', 'css', 'php', 'django', 'laravel', 'web'],
    mobile: ['flutter', 'android', 'kotlin', 'swift', 'ios', 'react native', 'mobile'],
    data: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'data', 'ia ', 'ai ', 'nlp', 'scikit'],
    cloud: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'devops', 'terraform', 'ci/cd', 'jenkins'],
    security: ['sécurité', 'security', 'pentest', 'cyber', 'owasp', 'forensic'],
    networks: ['réseau', 'network', 'cisco', 'ccna', 'tcp/ip', 'routage'],
}

const monthNames: Record<string, number> = {
    janvier: 1,
    january: 1,
    février: 2,
    fevrier: 2,
    february: 2,
    mars: 3,
    march: 3,
    avril: 4,
    april: 4,
    mai: 5,
    may: 5,
    juin: 6,
    june: 6,
    juillet: 7,
    july: 7,
    août: 8,
    aout: 8,
    august: 8,
    septembre: 9,
    september: 9,
    octobre: 10,
    october: 10,
    novembre: 11,
    november: 11,
    décembre: 12,
    decembre: 12,
    december: 12,
}

export const KNOWN_PLACES = ['Sfax', 'Tunis', 'Sousse', 'remote', 'France', 'anywhere']

export type Guess = { prefs: Preferences; fromCv: Set<keyof Preferences> }

export function guessFromCv(c: ResumeContent | undefined): Guess {
    const prefs: Preferences = { topics: [], skills: [], places: [], work_modes: [], start_month: null, durations: [] }
    const fromCv = new Set<keyof Preferences>()
    if (!c) return { prefs, fromCv }
    const skills = [...c.skills, ...(c.skill_groups ?? []).flatMap((g) => g.items)].filter((s, i, a) => s && a.indexOf(s) === i)
    const text = ` ${[
        ...skills,
        ...(c.projects ?? []).flatMap((p) => [p.name, p.tech, ...p.description]),
        ...c.experience.flatMap((e) => [e.title, ...e.description]),
    ]
        .join(' ')
        .toLowerCase()} `
    prefs.topics = (Object.keys(topicWords) as Topic[]).filter((t) => topicWords[t].some((w) => text.includes(w))).slice(0, 3)
    if (prefs.topics.length) fromCv.add('topics')
    prefs.skills = skills.slice(0, 6)
    if (prefs.skills.length) fromCv.add('skills')
    const city = c.contact.location.split(',')[0]?.trim()
    if (city) {
        prefs.places = [city]
        fromCv.add('places')
    }
    const headline = (c.contact.headline ?? '').toLowerCase()
    const months = headline.match(/(\d{1,2})\s*(mois|months?)/)
    if (months && Number(months[1]) >= 1 && Number(months[1]) <= 12) {
        prefs.durations = [Number(months[1])]
        fromCv.add('durations')
    }
    const start = headline.match(
        /(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})/,
    )
    if (start) {
        prefs.start_month = `${start[2]}-${String(monthNames[start[1]]).padStart(2, '0')}`
        fromCv.add('start_month')
    }
    return { prefs, fromCv }
}

// monthOptions are the three months around the guessed start, or the first three of next year.
export function monthOptions(start: string | null, today = new Date()): string[] {
    const [y, m] = start ? start.split('-').map(Number) : [today.getFullYear() + 1, 2]
    return [-1, 0, 1].map((d) => {
        const date = new Date(Date.UTC(y, m - 1 + d, 1))
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    })
}
