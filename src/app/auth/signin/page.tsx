import { Suspense } from 'react'
import SignIn from '@/components/auth/SignIn'

export default function Page() {
    return (
        <Suspense>
            <SignIn />
        </Suspense>
    )
}
