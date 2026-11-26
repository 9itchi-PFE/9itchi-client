import type { PropsWithChildren } from 'react'
import RenewalBanner from '@/components/billing/RenewalBanner'
import NotificationsProvider from '@/components/notifications/NotificationsProvider'
import StudentHeader from './StudentHeader'

export default function StudentLayout({ children }: PropsWithChildren) {
    return (
        <NotificationsProvider>
            <div className="flex min-h-screen min-h-dvh flex-col">
                <StudentHeader />
                <RenewalBanner />
                {/* Room for the bar of sections at the bottom of a phone. */}
                <main className="flex-1 pb-[76px] lg:pb-0">{children}</main>
            </div>
        </NotificationsProvider>
    )
}
