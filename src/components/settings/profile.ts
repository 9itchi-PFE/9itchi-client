import type { MeInput } from '@/types/user'

export type ProfileError = 'nameRequired' | 'nameLong'

// profileInput builds what is saved from the form: the name as account-api takes it (1 to 100 characters), and
// the school ('' when none is chosen).
export function profileInput(name: string, school: string): { input: MeInput } | { error: ProfileError } {
    const n = name.trim().replace(/\s+/g, ' ')
    if (!n) return { error: 'nameRequired' }
    if (n.length > 100) return { error: 'nameLong' }
    return { input: { name: n, school: school.trim() } }
}
