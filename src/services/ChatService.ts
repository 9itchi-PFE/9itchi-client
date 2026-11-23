import { api } from './ApiService'

const ChatService = {
    listConversations: () => api('chat').get(`/conversations`),
    startConversation: (data?: unknown) => api('chat').post(`/admin/conversations`, data),
    markConversationRead: (id: string, data?: unknown) => api('chat').put(`/conversations/${id}/read`, data),
    globalUnreadCount: () => api('chat').get(`/user/global-unread-count`),
    ablyToken: () => api('chat').get(`/chat/ably-token`),
    listMessages: (id: string) => api('chat').get(`/conversations/${id}/messages`),
    sendMessage: (id: string, data?: unknown) => api('chat').post(`/conversations/${id}/messages`, data),
}

export default ChatService
