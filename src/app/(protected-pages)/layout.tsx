import type { PropsWithChildren } from 'react'
import { auth } from '@/auth'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'
import StudentLayout from '@/components/layouts/StudentLayout'
import { ADMIN } from '@/constants/roles.constant'

// Admins keep the sidebar; students get the header of the canvas.
export default async function Layout({ children }: PropsWithChildren) {
    const session = await auth()
    const role = (session?.user as { role?: string } | undefined)?.role
    if (role === ADMIN) return <PostLoginLayout>{children}</PostLoginLayout>
    return <StudentLayout>{children}</StudentLayout>
}
