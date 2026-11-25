import type { BaseRealtime } from 'ably/modular'
import type { LiveClient, LiveOptions } from './live'

// Ably's own option and client types are wider than the little that is used here.
type BaseRealtimeOptions = ConstructorParameters<typeof BaseRealtime>[0]

// loadRealtime loads Ably after the page (it is not needed to show it) and returns how to open a link. The modular
// build brings only what a subscriber needs: the connection, the WebSocket transport and the HTTP requests of the
// token.
export async function loadRealtime(): Promise<(options: LiveOptions) => LiveClient> {
    const { BaseRealtime, WebSocketTransport, FetchRequest } = await import('ably/modular')
    return (options) =>
        new BaseRealtime({
            ...options,
            plugins: { WebSocketTransport, FetchRequest },
        } as unknown as BaseRealtimeOptions) as unknown as LiveClient
}
