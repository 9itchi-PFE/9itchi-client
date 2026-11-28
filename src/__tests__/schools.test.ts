import { describe, expect, it } from 'vitest'
import { schoolInput, schoolNames } from '@/components/admin/schools'
import { schoolChoices, schoolLabel, schoolName } from '@/lib/schools'
import type { School } from '@/types/school'

const ENIS: School = { code: 'ENIS', name_fr: 'ENIS fr', name_en: 'ENIS en', name_ar: 'ENIS ar' }
const ENETCOM: School = { code: 'ENETCOM', name_fr: 'ENET’Com fr', name_en: 'ENET’Com en', name_ar: '' }

describe('the form of a school', () => {
    it('upper-cases the code and tidies the names', () => {
        expect(schoolInput({ code: ' enetcom ', name_fr: '  ENET’Com   Sfax ', name_en: 'en', name_ar: 'ar' })).toEqual({
            input: { code: 'ENETCOM', name_fr: 'ENET’Com Sfax', name_en: 'en', name_ar: 'ar' },
        })
    })
    it('refuses a code account-api would refuse', () => {
        for (const code of ['', 'A', 'EN IS', 'ÉCOLE', 'A'.repeat(21)]) {
            expect(schoolInput({ code, name_fr: 'x', name_en: 'x', name_ar: 'x' })).toEqual({ error: 'schCodeBad' })
        }
        expect(schoolInput({ code: 'ENI-S_2', name_fr: 'x', name_en: 'x', name_ar: 'x' })).toHaveProperty('input')
    })
    it('needs the three names, 160 characters at most', () => {
        expect(schoolNames({ name_fr: 'x', name_en: '  ', name_ar: 'x' })).toEqual({ error: 'schNameRequired' })
        expect(schoolNames({ name_fr: 'x', name_en: 'x' })).toEqual({ error: 'schNameRequired' })
        expect(schoolNames({ name_fr: 'é'.repeat(161), name_en: 'x', name_ar: 'x' })).toEqual({ error: 'schNameLong' })
        expect(schoolNames({ name_fr: 'é'.repeat(160), name_en: 'x', name_ar: 'x' })).toHaveProperty('names')
    })
})

describe('the schools a student can choose', () => {
    const list = [ENIS, ENETCOM]
    it('names a school in the language of the app, falling back to French', () => {
        expect(schoolName(ENIS, 'en')).toBe('ENIS en')
        expect(schoolName(ENIS, 'ar')).toBe('ENIS ar')
        expect(schoolName(ENETCOM, 'ar')).toBe('ENET’Com fr')
        expect(schoolName(ENIS, 'fr')).toBe('ENIS fr')
    })
    it('lists the schools then « Other », and keeps a school the list no longer has', () => {
        expect(schoolChoices(list, undefined)).toEqual(['ENIS', 'ENETCOM', 'OTHER'])
        expect(schoolChoices(list, 'ENIS')).toEqual(['ENIS', 'ENETCOM', 'OTHER'])
        expect(schoolChoices(list, 'OTHER')).toEqual(['ENIS', 'ENETCOM', 'OTHER'])
        expect(schoolChoices(list, 'OLDSCHOOL')).toEqual(['OLDSCHOOL', 'ENIS', 'ENETCOM', 'OTHER'])
        expect(schoolChoices([], undefined)).toEqual(['OTHER'])
    })
    it('labels a choice by name, « Other » for OTHER, the code for a school that is gone', () => {
        expect(schoolLabel(list, 'ENIS', 'en', 'Other school')).toBe('ENIS en')
        expect(schoolLabel(list, 'OTHER', 'en', 'Other school')).toBe('Other school')
        expect(schoolLabel(list, 'OLDSCHOOL', 'en', 'Other school')).toBe('OLDSCHOOL')
    })
})
