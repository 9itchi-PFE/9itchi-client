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

// connectChannels opens one link and listens to an event on several channels. onMessage gets the channel a message
// came on. The token comes from the service that owns the channels (a signed request for these channels only).
// When no token can be had (Ably is not configured, the session ended) the link is closed for good: the page keeps
// its poll, and nothing asks again in a loop. It returns the function that closes the link.
export function connectChannels(input: {
    channels: string[]
    event: string
    getToken: () => Promise<unknown>
    onMessage: (channel: string, message: unknown) => void
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
        for (const name of input.channels) {
            // Subscribing attaches the channel and answers with a promise. It fails when the link never opens or is
            // closed meanwhile: nothing is lost, the page keeps its poll.
            Promise.resolve(client.channels.get(name).subscribe(input.event, (message) => input.onMessage(name, message))).catch(() => {})
        }
    }
    return close
}

// connectLive listens to one user's notifications and calls onNotification each time one arrives.
export function connectLive(input: {
    userId: string
    getToken: () => Promise<unknown>
    onNotification: () => void
    create: (options: LiveOptions) => LiveClient
}): () => void {
    return connectChannels({
        channels: [channelOf(input.userId)],
        event: LIVE_EVENT,
        getToken: input.getToken,
        onMessage: () => input.onNotification(),
        create: input.create,
    })
}
