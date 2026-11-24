import { getSession } from 'next-auth/react'
import ResumeService from '@/services/ResumeService'
import { setAuthToken } from '@/services/ApiService'

// landingPath sends admins to the admin, a student without a CV to the import (screen 1.2), others to the
// offers or the page they were going to.
export async function landingPath(callbackUrl: string | null): Promise<string> {
    const session = await getSession()
    if (session?.user?.role === 'admin') return callbackUrl?.startsWith('/admin') ? callbackUrl : '/admin'
    setAuthToken(session?.accessToken)
    try {
        const { data } = await ResumeService.listResumes()
        if (data.total === 0) return '/resumes/upload'
    } catch {
        // The CV service may be down: the offers page still works.
    }
    return safeCallback(callbackUrl) ?? '/jobs'
}

// safeCallback keeps only same-site paths, never another origin.
export const safeCallback = (url: string | null) => (url && url.startsWith('/') && !url.startsWith('//') ? url : null)
