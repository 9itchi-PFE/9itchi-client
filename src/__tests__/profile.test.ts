import { describe, expect, it } from 'vitest'
import { profileInput } from '@/components/settings/profile'

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
