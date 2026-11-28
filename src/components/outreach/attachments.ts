// Helpers of the attachments an email carries (the CV and the cover letter as PDF), kept pure for the tests.
import type { AttachmentNames, Email, LetterFields, LetterLanguage } from '@/types/application'

// LETTER_MAX is the letter's file name length the field takes (email-api cuts the stem to 80 characters too).
export const LETTER_MAX = 80

// LetterChoice is what the student did with the cover letter: the name typed (edited: they typed one) and
// whether the letter goes with the email.
export type LetterChoice = { name: string; edited: boolean; attach: boolean }
export const firstChoice: LetterChoice = { name: '', edited: false, attach: true }

// choiceOf is the letter of a scheduled email as it was saved (old emails carry no letter).
export const choiceOf = (e: Pick<Email, 'letter_filename' | 'attach_letter'>): LetterChoice => ({
    name: e.letter_filename ?? '',
    edited: !!e.letter_filename,
    attach: e.attach_letter ?? false,
})

// letterStem is the name the student typed, else email-api's default: prefilled until edited, a refetch of the
// default never replaces a typed name.
export const letterStem = (c: LetterChoice, names?: AttachmentNames) => (c.edited ? c.name : (names?.letter_filename ?? ''))

const EXT = /\.(pdf|docx?)$/i
// stemOf drops the extension of a file name (the field shows .pdf beside it, a student may type it anyway).
export const stemOf = (file: string) => file.trim().replace(EXT, '').trim()

// sameName: the letter would carry the CV's name (email-api refuses it, case ignored).
export function sameName(letter: string, cvFilename: string) {
    const a = stemOf(letter).toLowerCase()
    return a !== '' && a === stemOf(cvFilename).toLowerCase()
}

// letterFields is what a send carries; no letter_filename when the field is empty: email-api names it.
export function letterFields(c: LetterChoice, names: AttachmentNames | undefined, language: LetterLanguage): LetterFields {
    const stem = stemOf(letterStem(c, names))
    return { letter_filename: stem || undefined, attach_letter: c.attach, language }
}

// letterEdit is what changed in a scheduled email's letter (PATCH): '' puts the default name back.
export function letterEdit(c: LetterChoice, saved: Pick<Email, 'letter_filename' | 'attach_letter'>): LetterFields {
    const out: LetterFields = {}
    const before = saved.letter_filename ?? ''
    const stem = c.edited ? stemOf(c.name) : before
    if (stem !== before) out.letter_filename = stem
    if (c.attach !== !!saved.attach_letter) out.attach_letter = c.attach
    return out
}

// attachmentError reads email-api's refusals about the attachments: the letter PDF could not be made (502), or
// the files are over Gmail's 25 MB (422).
export function attachmentError(status: number | undefined, message = ''): 'letterFailed' | 'tooLarge' | null {
    if (status === 502 && /cover letter/i.test(message)) return 'letterFailed'
    if (status === 422 && /larger than gmail/i.test(message)) return 'tooLarge'
    return null
}
