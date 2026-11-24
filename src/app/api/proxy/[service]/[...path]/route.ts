import { NextResponse, type NextRequest } from 'next/server'
import { getServerBaseUrl, serviceNames, type ServiceName } from '@/configs/services.config'

// Production proxy to the backend services. It forwards the method, path, query, body and the few headers
// the services read (Authorization, Content-Type, Accept); it never logs bodies or tokens.
const FORWARDED = ['authorization', 'content-type', 'accept', 'accept-language']
const RETURNED = ['content-type', 'content-disposition', 'cache-control', 'x-content-type-options']

async function forward(req: NextRequest, ctx: { params: Promise<{ service: string; path: string[] }> }) {
    const { service, path } = await ctx.params
    if (!serviceNames.includes(service as ServiceName)) return NextResponse.json({ error: 'unknown service' }, { status: 404 })
    if (path.some((p) => p === '..' || p.includes('/'))) return NextResponse.json({ error: 'bad path' }, { status: 400 })
    const base = getServerBaseUrl(service as ServiceName)
    if (!base) return NextResponse.json({ error: 'service not configured' }, { status: 502 })
    // Internal routes stay internal: the browser never reaches them through the proxy.
    if (path[0] === 'internal') return NextResponse.json({ error: 'not found' }, { status: 404 })

    const url = `${base.replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`
    const headers = new Headers()
    for (const h of FORWARDED) {
        const v = req.headers.get(h)
        if (v) headers.set(h, v)
    }
    const hasBody = !['GET', 'HEAD'].includes(req.method)
    try {
        const res = await fetch(url, {
            method: req.method,
            headers,
            body: hasBody ? req.body : undefined,
            redirect: 'manual',
            // @ts-expect-error duplex is required by Node fetch to stream a request body
            duplex: hasBody ? 'half' : undefined,
        })
        const out = new Headers()
        for (const h of RETURNED) {
            const v = res.headers.get(h)
            if (v) out.set(h, v)
        }
        return new NextResponse(res.body, { status: res.status, headers: out })
    } catch {
        return NextResponse.json({ error: 'service unavailable' }, { status: 502 })
    }
}

export const GET = forward
export const POST = forward
export const PUT = forward
export const DELETE = forward
export const PATCH = forward
