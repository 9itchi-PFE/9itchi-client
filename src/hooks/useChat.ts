import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ChatService from '@/services/ChatService'
import type { ConversationList, Message } from '@/types/chat'

export const chatKeys = {
    conversations: ['chat', 'conversations'] as const,
    support: ['chat', 'support'] as const,
    messages: (id: string) => ['chat', 'messages', id] as const,
}

// How often an open page asks again: a new message shows within a few seconds without anyone reloading.
const LIST_EVERY = 15 * 1000
const THREAD_EVERY = 5 * 1000

// useConversations lists the inbox (admin): every student's conversation, the one written to last first.
export function useConversations() {
    return useQuery({
        queryKey: chatKeys.conversations,
        queryFn: async () => (await ChatService.listConversations({ page_size: 100 })).data,
        refetchInterval: LIST_EVERY,
    })
}

// useSupport gives a student their conversation with the team (created the first time).
export function useSupport() {
    return useQuery({ queryKey: chatKeys.support, queryFn: async () => (await ChatService.openSupport()).data, staleTime: Infinity, retry: 1 })
}

// useMessages reads the last messages of a conversation, oldest first, and asks again every few seconds.
export function useMessages(id: string) {
    return useQuery({
        queryKey: chatKeys.messages(id),
        queryFn: async () => (await ChatService.listMessages(id, { page_size: 100 })).data.items.slice().reverse(),
        enabled: !!id,
        refetchInterval: THREAD_EVERY,
    })
}

// useSendMessage adds the message to the thread as soon as chat-api stored it.
export function useSendMessage(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (content: string) => (await ChatService.sendMessage(id, content)).data,
        onSuccess: (message) => {
            qc.setQueryData<Message[]>(chatKeys.messages(id), (old) => (old?.some((m) => m.id === message.id) ? old : [...(old ?? []), message]))
            qc.invalidateQueries({ queryKey: chatKeys.conversations })
        },
    })
}

// useMarkRead resets the caller's unread count of a conversation, in the inbox too.
export function useMarkRead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => ChatService.markConversationRead(id),
        onSuccess: (_res, id) =>
            qc.setQueryData<ConversationList>(chatKeys.conversations, (old) =>
                old ? { ...old, items: old.items.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)) } : old,
            ),
    })
}

// useStartConversation opens the team's conversation with a student (admin).
export function useStartConversation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (userId: string) => (await ChatService.startConversation(userId)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversations }),
    })
}

// useSetResolved marks a conversation as resolved or open again, in the inbox at once.
export function useSetResolved() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => (await ChatService.setResolved(id, resolved)).data,
        onSuccess: (conversation) =>
            qc.setQueryData<ConversationList>(chatKeys.conversations, (old) =>
                old ? { ...old, items: old.items.map((c) => (c.id === conversation.id ? { ...c, resolved_at: conversation.resolved_at } : c)) } : old,
            ),
    })
}
