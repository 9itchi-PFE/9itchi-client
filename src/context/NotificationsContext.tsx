'use client'

import { createContext } from 'react'

// Single owner of notification and unread state; fed by Ably (to be implemented).
export const NotificationsContext = createContext<{ unread: number; chatUnread: number }>({ unread: 0, chatUnread: 0 })
