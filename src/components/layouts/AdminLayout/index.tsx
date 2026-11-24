import type { PropsWithChildren } from 'react'
import AdminHeader from './AdminHeader'

export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col bg-[#F2F3F5]">
            <AdminHeader />
            <main className="flex-1">{children}</main>
        </div>
    )
}
