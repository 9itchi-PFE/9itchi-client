import { describe, expect, it } from 'vitest'
import { usableSuggestion } from '@/components/resume/check/usableSuggestion'

const was = 'Developed a C++ module to alert on expiring certificates.'

describe('usableSuggestion', () => {
    it('skips a proposal that is the line as it is', () => {
        expect(usableSuggestion([` ${was} `, 'Built a C++ alert module.'], was, false)).toBe('Built a C++ alert module.')
        expect(usableSuggestion([was], was, false)).toBe('')
    })
    it('needs a figure or a mark when the check asks for one', () => {
        expect(usableSuggestion(['Built a C++ alert module.', 'Built a C++ module alerting on [NUMBER] terminals.'], was, true)).toBe(
            'Built a C++ module alerting on [NUMBER] terminals.',
        )
        expect(usableSuggestion(['Cut shutdowns by 30 %.'], was, true)).toBe('Cut shutdowns by 30 %.')
        expect(usableSuggestion(['Built a C++ alert module.'], was, true)).toBe('')
    })
})
