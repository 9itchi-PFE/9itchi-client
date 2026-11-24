'use client'

import type { PropsWithChildren } from 'react'
import { NotificationsContext } from '@/context/NotificationsContext'
import { useUnreadCount } from '@/hooks/useNotifications'

// NotificationsProvider gives the header its unread count. While notification-api cannot be reached the bell shows
// nothing new.
export default function NotificationsProvider({ children }: PropsWithChildren) {
    const unread = useUnreadCount().data ?? 0
    return <NotificationsContext.Provider value={{ unread }}>{children}</NotificationsContext.Provider>
}
