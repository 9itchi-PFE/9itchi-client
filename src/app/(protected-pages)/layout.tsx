import type { PropsWithChildren } from 'react'
import { auth } from '@/auth'
import AdminLayout from '@/components/layouts/AdminLayout'
import StudentLayout from '@/components/layouts/StudentLayout'
import { ADMIN } from '@/constants/roles.constant'

// Admins get the admin header of the canvas; students the student header.
export default async function Layout({ children }: PropsWithChildren) {
    const session = await auth()
    const role = (session?.user as { role?: string } | undefined)?.role
    if (role === ADMIN) return <AdminLayout>{children}</AdminLayout>
    return <StudentLayout>{children}</StudentLayout>
}
