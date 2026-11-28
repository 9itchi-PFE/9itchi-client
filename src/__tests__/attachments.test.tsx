import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import AttachmentFields from '@/components/outreach/AttachmentFields'
import { attachmentError, choiceOf, firstChoice, letterEdit, letterFields, letterStem, sameName, type LetterChoice } from '@/components/outreach/attachments'
import { applyError } from '@/components/applications/apply'
import fr from '../../messages/fr.json'

const names = { cv_filename: 'CV Prénom Nom.pdf', letter_filename: 'Lettre_de_motivation_Prénom_Nom' }

const render = (value: LetterChoice, cvFilename = names.cv_filename, n = names) =>
    renderToStaticMarkup(
        <NextIntlClientProvider locale="fr" messages={fr} timeZone="Africa/Tunis">
            <AttachmentFields cvFilename={cvFilename} names={n} value={value} onChange={() => {}} />
        </NextIntlClientProvider>,
    )

describe('letterStem', () => {
    it('prefills the default until the student types a name', () => {
        expect(letterStem(firstChoice, names)).toBe('Lettre_de_motivation_Prénom_Nom')
        expect(letterStem(firstChoice, undefined)).toBe('')
    })
    it('keeps a typed name when the default is fetched again', () => {
        const typed = { ...firstChoice, name: 'Ma lettre', edited: true }
        expect(letterStem(typed, { ...names, letter_filename: 'Cover_letter_Prénom_Nom' })).toBe('Ma lettre')
        // A cleared field stays cleared: email-api names it.
        expect(letterStem({ ...typed, name: '' }, names)).toBe('')
    })
})

describe('sameName', () => {
    it('compares stems without the extension, case ignored', () => {
        expect(sameName('cv prénom nom', 'CV Prénom Nom.pdf')).toBe(true)
        expect(sameName('CV Prénom Nom.PDF', 'CV Prénom Nom.docx')).toBe(true)
        expect(sameName('Lettre', 'CV Prénom Nom.pdf')).toBe(false)
        expect(sameName('', '')).toBe(false)
    })
})

describe('letterFields', () => {
    it('sends the default name, a typed one, or none when cleared', () => {
        expect(letterFields(firstChoice, names, 'fr')).toEqual({ letter_filename: 'Lettre_de_motivation_Prénom_Nom', attach_letter: true, language: 'fr' })
        expect(letterFields({ name: ' Ma lettre.pdf ', edited: true, attach: true }, names, 'ar').letter_filename).toBe('Ma lettre')
        expect(letterFields({ name: '', edited: true, attach: false }, names, 'en')).toEqual({
            letter_filename: undefined,
            attach_letter: false,
            language: 'en',
        })
    })
})

describe('letterEdit', () => {
    it('sends only what changed, and "" to go back to the default', () => {
        const saved = { letter_filename: 'Ma lettre', attach_letter: true }
        expect(letterEdit(choiceOf(saved), saved)).toEqual({})
        expect(letterEdit({ ...choiceOf(saved), name: '' }, saved)).toEqual({ letter_filename: '' })
        expect(letterEdit({ ...choiceOf(saved), attach: false }, saved)).toEqual({ attach_letter: false })
        const old = { letter_filename: null, attach_letter: false }
        expect(choiceOf(old)).toEqual({ name: '', edited: false, attach: false })
        expect(letterEdit({ name: 'Lettre', edited: true, attach: true }, old)).toEqual({ letter_filename: 'Lettre', attach_letter: true })
    })
})

describe('attachment errors', () => {
    it('reads the letter and size refusals before the other 422s', () => {
        expect(attachmentError(502, 'the cover letter could not be attached')).toBe('letterFailed')
        expect(attachmentError(422, 'the attachments are larger than Gmail allows (25 MB)')).toBe('tooLarge')
        expect(attachmentError(502)).toBeNull()
        expect(applyError(502, 'the cover letter could not be attached')).toBe('letterFailed')
        expect(applyError(422, 'the attachments are larger than Gmail allows (25 MB)')).toBe('tooLarge')
        expect(applyError(422)).toBe('noEmail')
    })
})

describe('AttachmentFields', () => {
    it('shows the CV name read-only and the letter name prefilled', () => {
        const html = render(firstChoice)
        expect(html).toContain('CV Prénom Nom.pdf')
        expect(html).toContain('value="Lettre_de_motivation_Prénom_Nom"')
        expect(html).toContain('maxLength="80"')
        expect(html).toContain('.pdf')
        expect(html).not.toContain('role="alert"')
        // The CV name is no field.
        expect(html.match(/<input/g)).toHaveLength(2)
    })
    it('keeps the typed name over a refetched default', () => {
        const html = render({ name: 'Ma lettre', edited: true, attach: true }, names.cv_filename, { ...names, letter_filename: 'Autre' })
        expect(html).toContain('value="Ma lettre"')
    })
    it('says when the letter would carry the CV name', () => {
        expect(render({ name: 'cv prénom nom', edited: true, attach: true })).toContain(fr.outreach.attachments.sameName)
    })
    it('hides the CV line without a CV and the name without the letter', () => {
        const html = render({ ...firstChoice, attach: false }, '')
        expect(html).not.toContain(fr.outreach.attachments.cvName)
        expect(html.match(/<input/g)).toHaveLength(1)
    })
})
