import { getServerBaseUrl } from '@/configs/services.config'

export type Tokens = { access_token: string; refresh_token: string }

// account-api rotates refresh tokens: a token can be used once. Concurrent requests that find an expired
// access token share one refresh (and its result for a short while) instead of burning the token twice.
const inFlight = new Map<string, { at: number; promise: Promise<Tokens> }>()
const KEEP_MS = 30_000

export function refreshTokens(refreshToken: string): Promise<Tokens> {
    const now = Date.now()
    for (const [k, v] of inFlight) if (now - v.at > KEEP_MS) inFlight.delete(k)
    const hit = inFlight.get(refreshToken)
    if (hit) return hit.promise
    const promise = (async () => {
        const res = await fetch(`${getServerBaseUrl('account').replace(/\/$/, '')}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
            cache: 'no-store',
        })
        if (!res.ok) throw new Error(`refresh failed: ${res.status}`)
        return (await res.json()) as Tokens
    })()
    inFlight.set(refreshToken, { at: now, promise })
    promise.catch(() => inFlight.delete(refreshToken))
    return promise
}
