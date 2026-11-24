// The live link to notification-api through Ably: a notification stored for the student is pushed to their channel
// and the page asks for the list again, without waiting for the next poll.

// LiveChannel and LiveClient are the little of Ably's Realtime client that is used here; tests replace them.
export type LiveChannel = { subscribe: (event: string, listener: (message: unknown) => void) => unknown }
export type LiveClient = { channels: { get: (name: string) => LiveChannel }; close: () => void }
export type TokenCallback = (error: string | null, token: unknown) => void
export type LiveOptions = { authCallback: (params: unknown, callback: TokenCallback) => void }

// channelOf is the channel notification-api publishes a user's notifications on.
export const channelOf = (userId: string) => `user:${userId}`
export const LIVE_EVENT = 'notification'

// connectLive opens the link and calls onNotification each time one arrives. The token comes from notification-api
// (a signed request for this user's channel only). When no token can be had — Ably is not configured, the session
// ended — the link is closed for good: the bell keeps its poll, and nothing asks again in a loop. It returns the
// function that closes the link.
export function connectLive(input: {
    userId: string
    getToken: () => Promise<unknown>
    onNotification: () => void
    create: (options: LiveOptions) => LiveClient
}): () => void {
    let client: LiveClient | null = null
    let closed = false
    const close = () => {
        if (closed) return
        closed = true
        client?.close()
    }
    client = input.create({
        authCallback: (_params, callback) => {
            input.getToken().then(
                (token) => callback(null, token),
                () => {
                    callback('no token', null)
                    close()
                },
            )
        },
    })
    if (closed) client.close()
    else {
        // Subscribing attaches the channel and answers with a promise. It fails when the link never opens or is closed
        // meanwhile: nothing is lost, the bell keeps its poll.
        Promise.resolve(client.channels.get(channelOf(input.userId)).subscribe(LIVE_EVENT, () => input.onNotification())).catch(() => {})
    }
    return close
}
