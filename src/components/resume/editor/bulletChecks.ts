// Live checks of one CV line (screen 4.1), the client-side twin of rules 6, 7, 8 and 9 of the CV check.

const frVerbs = ['conçu', 'créé', 'mené', 'mis', 'lancé', 'écrit', 'fait', 'réduit', 'construit', 'pris', 'appris', 'dirigé', 'géré', 'obtenu']
const enIrregular = ['built', 'led', 'made', 'wrote', 'ran', 'won', 'took', 'set', 'grew', 'cut', 'taught', 'drove', 'began', 'sold', 'brought', 'kept', 'held']

export type LineChecks = { past: boolean; pronoun: boolean; short: boolean; number: boolean }

export function checkLine(text: string, language: string | null | undefined): LineChecks {
    const b = text.trim()
    const first = (b.split(/\s+/)[0] ?? '').toLowerCase().replace(/[^\p{L}'’]/gu, '')
    const en = language === 'en'
    const past = en ? /ed$/.test(first) || enIrregular.includes(first) : /(é|ée|és|ées|i|it|u|is)$/.test(first) || frVerbs.includes(first)
    const pronoun = en ? /\b(i|my|me|mine)\b/i.test(b) : /(^|[\s'’])(je|j['’]|moi|mon|ma|mes)(?=[\s,.]|$)/i.test(b)
    return { past: b.length > 0 && past, pronoun, short: b.length > 0 && b.length <= 150, number: /\d/.test(b) }
}
