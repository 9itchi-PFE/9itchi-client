import { Suspense } from 'react'
import GmailScreen from '@/components/applications/GmailScreen'

export default function Page() {
    return (
        <Suspense>
            <GmailScreen />
        </Suspense>
    )
}
