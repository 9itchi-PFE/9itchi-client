import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import NotificationService from '@/services/NotificationService'
import type { AlertPreference, AlertPreferences, NotificationList } from '@/types/notification'

export const notificationKeys = {
    list: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
    preferences: ['notifications', 'preferences'] as const,
}

// The page shows the latest notifications; 100 is the most notification-api gives at once.
const PAGE = 100
// The bell asks again every minute and when the window gets the focus back.
const UNREAD_EVERY = 60 * 1000

export function useNotifications() {
    return useQuery({ queryKey: notificationKeys.list, queryFn: async () => (await NotificationService.listNotifications({ page_size: PAGE })).data })
}

// useUnreadCount is the number behind the bell of the header.
export function useUnreadCount() {
    return useQuery({
        queryKey: notificationKeys.unread,
        queryFn: async () => (await NotificationService.listNotifications({ unread: true, page_size: 1 })).data.unread_count,
        refetchInterval: UNREAD_EVERY,
        refetchOnWindowFocus: true,
    })
}

// useMarkRead marks one notification as read; the list and the bell follow at once.
export function useMarkRead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => (await NotificationService.markRead(id)).data,
        onMutate: (id) => {
            const before = qc.getQueryData<NotificationList>(notificationKeys.list)
            const wasUnread = before?.items.some((n) => n.id === id && !n.read)
            if (before && wasUnread) {
                qc.setQueryData<NotificationList>(notificationKeys.list, {
                    ...before,
                    items: before.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
                    unread_count: Math.max(0, before.unread_count - 1),
                })
                qc.setQueryData<number>(notificationKeys.unread, (c) => Math.max(0, (c ?? 1) - 1))
            }
        },
        onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.list }),
    })
}

export function useMarkAllRead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async () => (await NotificationService.markAllRead()).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.list }),
    })
}

export function useAlertPreferences() {
    return useQuery({ queryKey: notificationKeys.preferences, queryFn: async () => (await NotificationService.preferences()).data })
}

// useSetAlertPreference changes one line of « Alertes ». The switch moves at once and comes back if the save fails.
export function useSetAlertPreference() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (next: AlertPreference) => (await NotificationService.setPreferences([next])).data,
        onMutate: async (next) => {
            await qc.cancelQueries({ queryKey: notificationKeys.preferences })
            const before = qc.getQueryData<AlertPreferences>(notificationKeys.preferences)
            if (before) qc.setQueryData<AlertPreferences>(notificationKeys.preferences, { items: before.items.map((p) => (p.kind === next.kind ? next : p)) })
            return { before }
        },
        onError: (_e, _next, ctx) => {
            if (ctx?.before) qc.setQueryData(notificationKeys.preferences, ctx.before)
        },
        onSuccess: (saved) => qc.setQueryData(notificationKeys.preferences, saved),
    })
}
