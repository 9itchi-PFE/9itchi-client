import type { Conversation, ConversationList, Message, MessageList } from '@/types/chat'
import { api } from './ApiService'

const ChatService = {
    // listConversations: every student's conversation for an admin, their own for a student.
    listConversations: (params?: { page?: number; page_size?: number }) => api('chat').get<ConversationList>(`/conversations`, { params }),
    // openSupport returns the student's conversation with the team, creating it on first use.
    openSupport: () => api('chat').post<Conversation>(`/conversations`),
    // startConversation returns the team's conversation with a student, creating it on first use (admin).
    startConversation: (userId: string) => api('chat').post<Conversation>(`/admin/conversations`, { user_id: userId }),
    // setResolved marks a conversation as resolved, or open again (admin).
    setResolved: (id: string, resolved: boolean) => api('chat').put<Conversation>(`/admin/conversations/${id}/resolved`, { resolved }),
    markConversationRead: (id: string) => api('chat').put(`/conversations/${id}/read`),
    globalUnreadCount: () => api('chat').get<{ unread_count: number }>(`/user/global-unread-count`),
    ablyToken: () => api('chat').get(`/chat/ably-token`),
    listMessages: (id: string, params?: { page?: number; page_size?: number }) => api('chat').get<MessageList>(`/conversations/${id}/messages`, { params }),
    sendMessage: (id: string, content: string) => api('chat').post<Message>(`/conversations/${id}/messages`, { content }),
}

export default ChatService
