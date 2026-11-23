'use client'

import { createContext, useContext } from 'react'
import type { User } from '@/@types/auth'

export type SessionState = { user?: User; token?: string }

export const SessionContext = createContext<SessionState>({})

// Read-only consumers use this instead of useSession().
export const useSessionContext = () => useContext(SessionContext)
