'use client'

import { useEffect, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSessionContext } from '@/components/auth/AuthProvider'
import { NotificationsContext } from '@/context/NotificationsContext'
import { notificationKeys, useUnreadCount } from '@/hooks/useNotifications'
import NotificationService from '@/services/NotificationService'
import type { BaseRealtime } from 'ably/modular'
import { connectLive, type LiveClient } from './live'

// NotificationsProvider gives the header its unread count. The count is asked for every minute, and at once when
// notification-api pushes a notification through Ably. While notification-api cannot be reached the bell shows
// nothing new.
type BaseRealtimeOptions = ConstructorParameters<typeof BaseRealtime>[0]

export default function NotificationsProvider({ children }: PropsWithChildren) {
    const unread = useUnreadCount().data ?? 0
    const qc = useQueryClient()
    const userId = useSessionContext().user?.id

    useEffect(() => {
        if (!userId) return
        let close = () => {}
        let left = false
        // Ably is loaded after the page: it is not needed to show it. The modular build brings only what a
        // subscriber needs: the connection, the WebSocket transport and the HTTP requests of the token.
        import('ably/modular')
            .then(({ BaseRealtime, WebSocketTransport, FetchRequest }) => {
                if (left) return
                close = connectLive({
                    userId,
                    getToken: async () => (await NotificationService.ablyToken()).data,
                    // The list key is the prefix of the unread key: both are asked for again.
                    onNotification: () => qc.invalidateQueries({ queryKey: notificationKeys.list }),
                    // Ably's own option and client types are wider than the little that is used here.
                    create: (options) =>
                        new BaseRealtime({
                            ...options,
                            plugins: { WebSocketTransport, FetchRequest },
                        } as unknown as BaseRealtimeOptions) as unknown as LiveClient,
                })
            })
            .catch(() => {
                /* Without the live link the bell keeps its poll. */
            })
        return () => {
            left = true
            close()
        }
    }, [userId, qc])

    return <NotificationsContext.Provider value={{ unread }}>{children}</NotificationsContext.Provider>
}
