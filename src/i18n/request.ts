import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { LOCALE_COOKIE, defaultLocale, isLocale, locales, type Locale } from './locales'

// No locale in the URL: the choice is a cookie set by the language menu, else the browser's language.
async function pickLocale(): Promise<Locale> {
    const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value
    if (isLocale(fromCookie)) return fromCookie
    const accept = (await headers()).get('accept-language') ?? ''
    for (const part of accept.split(',')) {
        const tag = part.split(';')[0].trim().slice(0, 2).toLowerCase()
        if ((locales as readonly string[]).includes(tag)) return tag as Locale
    }
    return defaultLocale
}

export default getRequestConfig(async () => {
    const locale = await pickLocale()
    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
        timeZone: 'Africa/Tunis',
    }
})
