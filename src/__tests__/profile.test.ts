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

describe('the rest of the profile', () => {
    const empty = { phone: '', city: '', speciality: '', year: '', linkedin: '', github: '' }

    it('is optional: empty values are sent as empty, so they clear what was saved', () => {
        expect(profileInput('Ines', 'ENIS', empty)).toEqual({ input: { name: 'Ines', school: 'ENIS', ...empty } })
    })
    it('tidies the phone and keeps the rest as typed', () => {
        const built = profileInput('Ines', '', {
            ...empty,
            phone: ' +216 20-000.000 ',
            city: ' Sfax ',
            year: 'ing3',
            linkedin: 'linkedin.com/in/ines-m',
            github: 'https://github.com/ines-m',
        })
        expect(built).toEqual({
            input: {
                name: 'Ines',
                school: '',
                phone: '+21620000000',
                city: 'Sfax',
                speciality: '',
                year: 'ing3',
                linkedin: 'linkedin.com/in/ines-m',
                github: 'https://github.com/ines-m',
            },
        })
    })
    it('drops a year it does not know', () => {
        expect(profileInput('Ines', '', { ...empty, year: 'phd' })).toEqual({ input: { name: 'Ines', school: '', ...empty } })
    })
    it('catches a phone or a link that cannot be one', () => {
        expect(profileInput('Ines', '', { ...empty, phone: 'appelle-moi' })).toEqual({ error: 'phoneBad' })
        expect(profileInput('Ines', '', { ...empty, phone: '1234' })).toEqual({ error: 'phoneBad' })
        expect(profileInput('Ines', '', { ...empty, linkedin: 'linkedin.com/company/acme' })).toEqual({ error: 'linkedinBad' })
        expect(profileInput('Ines', '', { ...empty, linkedin: 'http://linkedin.com/in/ines' })).toEqual({ error: 'linkedinBad' })
        expect(profileInput('Ines', '', { ...empty, github: 'gitlab.com/ines' })).toEqual({ error: 'githubBad' })
        expect(profileInput('Ines', '', { ...empty, github: 'github.com/ines/repo' })).toEqual({ error: 'githubBad' })
    })
    it('takes a LinkedIn address of a country, with what follows it', () => {
        expect('input' in profileInput('Ines', '', { ...empty, linkedin: 'https://tn.linkedin.com/in/ines-m/?trk=x' })).toBe(true)
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
