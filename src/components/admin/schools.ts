import type { SchoolInput, SchoolNames } from '@/types/school'

export type SchoolError = 'schCodeBad' | 'schNameRequired' | 'schNameLong'

export const SCHOOL_NAME_MAX = 160
const CODE = /^[A-Z0-9_-]{2,20}$/

type Raw = Partial<Record<keyof SchoolInput, string>>

const NAMES = ['name_fr', 'name_en', 'name_ar'] as const

// schoolNames tidies the three names as account-api takes them: 1 to 160 characters each.
export function schoolNames(raw: Raw): { names: SchoolNames } | { error: SchoolError } {
    const names = { name_fr: '', name_en: '', name_ar: '' }
    for (const k of NAMES) {
        const v = (raw[k] ?? '').trim().replace(/\s+/g, ' ')
        if (!v) return { error: 'schNameRequired' }
        if ([...v].length > SCHOOL_NAME_MAX) return { error: 'schNameLong' }
        names[k] = v
    }
    return { names }
}

// schoolInput builds what is sent to add a school: the code upper-cased (letters, digits, _ and -, 2 to 20 long).
export function schoolInput(raw: Raw): { input: SchoolInput } | { error: SchoolError } {
    const code = (raw.code ?? '').trim().toUpperCase()
    if (!CODE.test(code)) return { error: 'schCodeBad' }
    const built = schoolNames(raw)
    return 'error' in built ? built : { input: { code, ...built.names } }
}
