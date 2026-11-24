import { describe, expect, it, vi } from 'vitest'
import { LIVE_EVENT, channelOf, connectLive, type LiveOptions, type TokenCallback } from '@/components/notifications/live'

// fakeAbly records what the link asks of Ably and lets a test play Ably's part.
function fakeAbly() {
    const state = { options: null as LiveOptions | null, channel: '', event: '', listener: (_m: unknown) => {}, closed: 0 }
    const create = (options: LiveOptions) => {
        state.options = options
        return {
            channels: {
                get: (name: string) => {
                    state.channel = name
                    return {
                        subscribe: (event: string, listener: (m: unknown) => void) => {
                            state.event = event
                            state.listener = listener
                        },
                    }
                },
            },
            close: () => {
                state.closed++
            },
        }
    }
    // askToken plays Ably asking for a token and gives what the callback was called with.
    const askToken = () =>
        new Promise<Parameters<TokenCallback>>((resolve) => {
            state.options?.authCallback({}, (...args) => resolve(args))
        })
    return { state, create, askToken }
}

describe('connectLive', () => {
    it('listens to the channel of the user and asks again when a notification arrives', () => {
        const ably = fakeAbly()
        const onNotification = vi.fn()
        connectLive({ userId: 'u-1', getToken: async () => ({}), onNotification, create: ably.create })
        expect(ably.state.channel).toBe('user:u-1')
        expect(ably.state.channel).toBe(channelOf('u-1'))
        expect(ably.state.event).toBe(LIVE_EVENT)
        ably.state.listener({ data: { id: 'n1' } })
        ably.state.listener({ data: { id: 'n2' } })
        expect(onNotification).toHaveBeenCalledTimes(2)
    })

    it('gives Ably the token request notification-api signed', async () => {
        const ably = fakeAbly()
        const request = { keyName: 'app.key', clientId: 'u-1', mac: 'signed' }
        connectLive({ userId: 'u-1', getToken: async () => request, onNotification: () => {}, create: ably.create })
        expect(await ably.askToken()).toEqual([null, request])
        expect(ably.state.closed).toBe(0)
    })

    it('closes the link for good when no token can be had', async () => {
        const ably = fakeAbly()
        const getToken = vi.fn().mockRejectedValue(new Error('503'))
        connectLive({ userId: 'u-1', getToken, onNotification: () => {}, create: ably.create })
        const [error, token] = await ably.askToken()
        expect(error).toBe('no token')
        expect(token).toBeNull()
        expect(ably.state.closed).toBe(1)
    })

    it('closes once when the page leaves, whatever happened before', async () => {
        const ably = fakeAbly()
        const close = connectLive({ userId: 'u-1', getToken: async () => ({}), onNotification: () => {}, create: ably.create })
        close()
        close()
        expect(ably.state.closed).toBe(1)

        const other = fakeAbly()
        const closeOther = connectLive({ userId: 'u-1', getToken: () => Promise.reject(new Error('401')), onNotification: () => {}, create: other.create })
        await other.askToken()
        closeOther()
        expect(other.state.closed).toBe(1)
    })

    it('stays quiet when the channel cannot be attached', async () => {
        const create = () => ({
            channels: { get: () => ({ subscribe: () => Promise.reject(new Error('Connection closed')) }) },
            close: () => {},
        })
        connectLive({ userId: 'u-1', getToken: async () => ({}), onNotification: () => {}, create })
        // An unhandled rejection would fail the test run.
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
})
