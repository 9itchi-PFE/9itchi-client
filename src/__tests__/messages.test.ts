import { describe, expect, it } from 'vitest'
import fr from '../../messages/fr.json'
import en from '../../messages/en.json'
import ar from '../../messages/ar.json'

const keys = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))

describe('messages', () => {
    it('have the same keys in fr, en and ar', () => {
        const ref = keys(fr).sort()
        expect(keys(en).sort()).toEqual(ref)
        expect(keys(ar).sort()).toEqual(ref)
    })
    it('describe the 24 rules of the CV check', () => {
        expect(Object.keys(fr.check.rules)).toHaveLength(24)
    })
})
