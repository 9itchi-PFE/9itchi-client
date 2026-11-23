import { NextResponse } from 'next/server'

// Production proxy to backend services (forwards Authorization, never logs bodies). To be implemented.
const notImplemented = () => NextResponse.json({ error: 'not implemented' }, { status: 501 })

export const GET = notImplemented
export const POST = notImplemented
export const PUT = notImplemented
export const DELETE = notImplemented
