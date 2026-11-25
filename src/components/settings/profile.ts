import { YEARS, type MeInput, type ProfileMore, type Year } from '@/types/user'

export type ProfileError = 'nameRequired' | 'nameLong' | 'phoneBad' | 'linkedinBad' | 'githubBad'

const LINKEDIN = /^(https:\/\/)?([a-z]{2,3}\.|www\.)?linkedin\.com\/in\/[^/?#\s]{3,100}\/?([?#]\S*)?$/i
const GITHUB = /^(https:\/\/)?(www\.)?github\.com\/[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?\/?$/i

// profileInput builds what is saved from the form: the name as account-api takes it (1 to 100 characters), the
// school ('' when none is chosen) and, when the form has them, the optional rest of the profile. account-api has
// the last word on a phone number or a link; this only catches what it would surely refuse.
export function profileInput(name: string, school: string, more?: Partial<Record<keyof ProfileMore, string>>): { input: MeInput } | { error: ProfileError } {
    const n = name.trim().replace(/\s+/g, ' ')
    if (!n) return { error: 'nameRequired' }
    if (n.length > 100) return { error: 'nameLong' }
    const input: MeInput = { name: n, school: school.trim() }
    if (!more) return { input }
    const v = (k: keyof ProfileMore) => (more[k] ?? '').trim()
    const phone = v('phone').replace(/[\s.-]/g, '')
    if (phone && !/^\+?\d{8,15}$/.test(phone)) return { error: 'phoneBad' }
    if (v('linkedin') && !LINKEDIN.test(v('linkedin'))) return { error: 'linkedinBad' }
    if (v('github') && !GITHUB.test(v('github'))) return { error: 'githubBad' }
    const year = (YEARS as readonly string[]).includes(v('year')) ? (v('year') as Year) : ''
    return {
        input: { ...input, phone, city: v('city').slice(0, 80), speciality: v('speciality').slice(0, 120), year, linkedin: v('linkedin'), github: v('github') },
    }
}

// confirmed says the student typed the word that confirms the deletion (case and spaces around it do not count).
export const confirmed = (typed: string, word: string) => typed.trim().toLocaleUpperCase() === word.trim().toLocaleUpperCase()
