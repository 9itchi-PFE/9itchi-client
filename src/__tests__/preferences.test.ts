import { describe, expect, it } from 'vitest'
import { guessFromCv, monthOptions } from '@/components/preferences/guess'
import { normalize } from '@/types/resume'
import { allSkills } from '@/components/resume/cvText'

describe('guessFromCv', () => {
    it('reads topics, skills, city, start and length from the CV', () => {
        const c = normalize({
            contact: {
                name: 'Ines',
                headline: 'Élève ingénieure · Stage PFE de 6 mois dès février 2027',
                email: '',
                phone: '',
                location: 'Sfax, Tunisie',
                links: [],
            },
            skills: ['C++', 'Linux', 'React', 'Python'],
            projects: [{ name: 'Lecteur NFC', tech: 'C++', year: '2026', description: [] }],
        })
        const g = guessFromCv(c)
        expect(g.prefs.topics).toEqual(['embedded', 'web'])
        expect(g.prefs.skills).toEqual(['C++', 'Linux', 'React', 'Python'])
        expect(g.prefs.places).toEqual(['Sfax'])
        expect(g.prefs.start_month).toBe('2027-02')
        expect(g.prefs.durations).toEqual([6])
        expect([...g.fromCv].sort()).toEqual(['durations', 'places', 'skills', 'start_month', 'topics'])
        expect(g.prefs.work_modes).toEqual([])
    })
    it('splits a skill that is a whole list and drops the ones job-api refuses', () => {
        const c = normalize({
            skills: ['FastAPI, Django, Spring Boot', 'Docker; Kubernetes', 'React', 'x'.repeat(51)],
            skill_groups: [{ label: 'Web', items: ['React, Next.js'] }],
        })
        expect(guessFromCv(c).prefs.skills).toEqual(['FastAPI', 'Django', 'Spring Boot', 'Docker', 'Kubernetes', 'React'])
    })
    it('asks everything without a CV', () => {
        expect(guessFromCv(undefined).fromCv.size).toBe(0)
    })
})

describe('monthOptions', () => {
    it('surrounds the start month, across years', () => {
        expect(monthOptions('2027-02')).toEqual(['2027-01', '2027-02', '2027-03'])
        expect(monthOptions('2027-01')).toEqual(['2026-12', '2027-01', '2027-02'])
        expect(monthOptions(null, new Date(2026, 10, 1))).toEqual(['2027-01', '2027-02', '2027-03'])
    })
})

describe('allSkills', () => {
    it('splits a skill that is a whole list so the offers query stays valid', () => {
        const c = normalize({
            skills: ['Python, LLM, RAG', 'Docker; Kubernetes', 'x'.repeat(51)],
            skill_groups: [{ label: 'Web', items: ['React, Python'] }],
        })
        expect(allSkills(c)).toEqual(['Python', 'LLM', 'RAG', 'Docker', 'Kubernetes', 'React'])
    })
})
