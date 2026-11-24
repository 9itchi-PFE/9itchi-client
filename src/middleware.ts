import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import appConfig from '@/configs/app.config'
import { authRoutes, protectedRoutes, publicRoutes } from '@/configs/routes.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'

export default auth((req) => {
    const { nextUrl } = req
    const session = req.auth
    const isSignedIn = !!session && !session.error
    const path = nextUrl.pathname

    if (path.startsWith(`${appConfig.apiPrefix}/auth`)) return NextResponse.next()
    if (path in authRoutes) {
        return isSignedIn ? NextResponse.redirect(new URL(appConfig.authenticatedEntryPath, nextUrl)) : NextResponse.next()
    }
    if (path in publicRoutes || path.startsWith(appConfig.apiPrefix)) return NextResponse.next()
    if (!isSignedIn) {
        const callback = encodeURIComponent(nextUrl.pathname + nextUrl.search)
        return NextResponse.redirect(new URL(`${appConfig.unAuthenticatedEntryPath}?${REDIRECT_URL_KEY}=${callback}`, nextUrl))
    }
    // A page reserved to another role sends the user back to their own home.
    const role = session.user?.role ?? ''
    const rule = Object.entries(protectedRoutes).find(([prefix]) => path === prefix || path.startsWith(prefix + '/'))
    if (rule && !rule[1].includes(role)) {
        return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : appConfig.authenticatedEntryPath, nextUrl))
    }
    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
