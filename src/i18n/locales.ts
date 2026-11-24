export const locales = ['fr', 'en', 'ar'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (locales as readonly string[]).includes(v)

// Arabic reads right to left.
export const dirOf = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr')
