import type { PropsWithChildren } from 'react'
import RenewalBanner from '@/components/billing/RenewalBanner'
import NotificationsProvider from '@/components/notifications/NotificationsProvider'
import StudentHeader from './StudentHeader'

export default function StudentLayout({ children }: PropsWithChildren) {
    return (
        <NotificationsProvider>
            <div className="flex min-h-screen flex-col">
                <StudentHeader />
                <RenewalBanner />
                <main className="flex-1">{children}</main>
            </div>
        </NotificationsProvider>
    )
}
