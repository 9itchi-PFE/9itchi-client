import { Suspense } from 'react'
import SupportScreen from '@/components/admin/SupportScreen'

export default function Page() {
    return (
        <Suspense>
            <SupportScreen />
        </Suspense>
    )
}
