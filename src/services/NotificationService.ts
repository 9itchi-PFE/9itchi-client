import type { AlertPreference, AlertPreferences, Notification, NotificationList } from '@/types/notification'
import { api } from './ApiService'

const NotificationService = {
    listNotifications: (params?: { page?: number; page_size?: number; unread?: boolean }) =>
        api('notification').get<NotificationList>(`/notifications`, { params }),
    markRead: (id: string) => api('notification').put<Notification>(`/notifications/${id}/read`),
    markAllRead: () => api('notification').put<{ updated: number }>(`/notifications/read-all`),
    ablyToken: () => api('notification').get(`/notifications/ably-token`),
    // preferences say, for each kind of alert, whether it goes by email and in 9itchi.
    preferences: () => api('notification').get<AlertPreferences>(`/notifications/preferences`),
    setPreferences: (items: AlertPreference[]) => api('notification').put<AlertPreferences>(`/notifications/preferences`, { items }),
}

export default NotificationService
