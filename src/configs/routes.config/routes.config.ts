import { ADMIN, CANDIDATE } from '@/constants/roles.constant'

// Path prefix -> roles allowed. Everything not public or auth is protected.
export const protectedRoutes: Record<string, string[]> = {
    '/dashboard': [CANDIDATE, ADMIN],
    '/resumes': [CANDIDATE],
    '/jobs': [CANDIDATE],
    '/applications': [CANDIDATE],
    '/emails': [CANDIDATE],
    '/notifications': [CANDIDATE, ADMIN],
    '/support': [CANDIDATE],
    '/settings': [CANDIDATE],
    '/preferences': [CANDIDATE],
    '/admin': [ADMIN],
}
