import { Suspense } from 'react'
import ResetPassword from '@/components/auth/ResetPassword'

export default function Page() {
    return (
        <Suspense>
            <ResetPassword />
        </Suspense>
    )
}
