import { api } from './ApiService'

const NotificationService = {
    listNotifications: () => api('notification').get(`/notifications`),
    markRead: (id: string, data?: unknown) => api('notification').put(`/notifications/${id}/read`, data),
    markAllRead: (data?: unknown) => api('notification').put(`/notifications/read-all`, data),
    ablyToken: () => api('notification').get(`/notifications/ably-token`),
}

export default NotificationService
