import type { School } from '@/types/school'

// OTHER_SCHOOL is the choice for a student whose school is not in the list; the client adds it, account-api does not
// keep it.
export const OTHER_SCHOOL = 'OTHER'

// schoolName is the name of a school in the language of the app (French when that one is missing, then the code).
export function schoolName(school: School, locale: string): string {
    const name = locale === 'en' ? school.name_en : locale === 'ar' ? school.name_ar : school.name_fr
    return name || school.name_fr || school.code
}

// schoolChoices lists what a student can choose: every school of the list, then « Other ». A school the student
// already has but the list no longer offers stays at the top, so saving the profile does not silently drop it.
export function schoolChoices(list: School[], current: string | undefined): string[] {
    const codes = list.map((s) => s.code)
    const kept = current && current !== OTHER_SCHOOL && !codes.includes(current) ? [current] : []
    return [...kept, ...codes, OTHER_SCHOOL]
}

// schoolLabel is how a choice reads in the drop-down: the name of the school, « Other » for OTHER, and the bare code
// for a school the list no longer has.
export function schoolLabel(list: School[], code: string, locale: string, other: string): string {
    if (code === OTHER_SCHOOL) return other
    const school = list.find((s) => s.code === code)
    return school ? schoolName(school, locale) : code
}
