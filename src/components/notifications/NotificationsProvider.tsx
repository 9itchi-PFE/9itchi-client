'use client'

import { useEffect, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatBadge } from '@/components/chat/useLiveChat'
import { useSessionContext } from '@/components/auth/AuthProvider'
import { NotificationsContext } from '@/context/NotificationsContext'
import { useTitleCount } from '@/hooks/useTitleCount'
import { notificationKeys, useUnreadCount } from '@/hooks/useNotifications'
import NotificationService from '@/services/NotificationService'
import { connectLive } from './live'
import { loadRealtime } from './realtime'

// NotificationsProvider gives the header its unread count. The count is asked for every minute, and at once when
// notification-api pushes a notification through Ably. While notification-api cannot be reached the bell shows
// nothing new.
export default function NotificationsProvider({ children }: PropsWithChildren) {
    const unread = useUnreadCount().data ?? 0
    const chatUnread = useChatBadge()
    useTitleCount(unread + chatUnread)
    const qc = useQueryClient()
    const userId = useSessionContext().user?.id

    useEffect(() => {
        if (!userId) return
        let close = () => {}
        let left = false
        loadRealtime()
            .then((create) => {
                if (left) return
                close = connectLive({
                    userId,
                    getToken: async () => (await NotificationService.ablyToken()).data,
                    // The list key is the prefix of the unread key: both are asked for again.
                    onNotification: () => qc.invalidateQueries({ queryKey: notificationKeys.list }),
                    create,
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

    return <NotificationsContext.Provider value={{ unread, chatUnread }}>{children}</NotificationsContext.Provider>
}
