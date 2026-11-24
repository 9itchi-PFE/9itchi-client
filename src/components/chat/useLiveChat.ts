import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectChannels } from '@/components/notifications/live'
import { loadRealtime } from '@/components/notifications/realtime'
import { chatKeys } from '@/hooks/useChat'
import ChatService from '@/services/ChatService'

// CHAT_EVENT is the event chat-api publishes a stored message under; the channel is the conversation id.
export const CHAT_EVENT = 'message'

// useLiveChat listens to the conversations on the page: when chat-api pushes a message, its thread and the inbox
// are read again at once instead of at the next poll. Without Ably (not configured, unreachable) the polls remain.
export function useLiveChat(conversationIds: string[]) {
    const qc = useQueryClient()
    // The link is opened again only when the set of conversations changes (its token names them).
    const key = [...conversationIds].sort().join(',')
    useEffect(() => {
        if (!key) return
        let close = () => {}
        let left = false
        loadRealtime()
            .then((create) => {
                if (left) return
                close = connectChannels({
                    channels: key.split(','),
                    event: CHAT_EVENT,
                    getToken: async () => (await ChatService.ablyToken()).data,
                    onMessage: (conversationId) => {
                        qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) })
                        qc.invalidateQueries({ queryKey: chatKeys.conversations })
                    },
                    create,
                })
            })
            .catch(() => {
                /* Without the live link the pages keep their polls. */
            })
        return () => {
            left = true
            close()
        }
    }, [key, qc])
}
