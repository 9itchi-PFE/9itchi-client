import { describe, expect, it } from 'vitest'
import { confirmed, profileInput } from '@/components/settings/profile'

describe('the profile form', () => {
    it('tidies the name and keeps the school', () => {
        expect(profileInput('  Ines   Mansour ', 'ENIS')).toEqual({ input: { name: 'Ines Mansour', school: 'ENIS' } })
        expect(profileInput('Ines', '')).toEqual({ input: { name: 'Ines', school: '' } })
    })
    it('needs a name of 100 characters at most', () => {
        expect(profileInput('   ', 'ENIS')).toEqual({ error: 'nameRequired' })
        expect(profileInput('x'.repeat(101), '')).toEqual({ error: 'nameLong' })
        expect(profileInput('x'.repeat(100), '')).toEqual({ input: { name: 'x'.repeat(100), school: '' } })
    })
})

describe('confirming the deletion of the account', () => {
    it('takes the word whatever its case or the spaces around it', () => {
        expect(confirmed('SUPPRIMER', 'SUPPRIMER')).toBe(true)
        expect(confirmed('  supprimer ', 'SUPPRIMER')).toBe(true)
        expect(confirmed('حذف', 'حذف')).toBe(true)
    })
    it('takes nothing else', () => {
        expect(confirmed('', 'SUPPRIMER')).toBe(false)
        expect(confirmed('SUPPRIME', 'SUPPRIMER')).toBe(false)
        expect(confirmed('DELETE', 'SUPPRIMER')).toBe(false)
    })
})
