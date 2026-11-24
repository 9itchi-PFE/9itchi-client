import { Suspense } from 'react'
import OffersScreen from '@/components/jobs/OffersScreen'
import { OffersSkeleton } from '@/components/jobs/OfferStates'

export default function Page() {
    return (
        <Suspense fallback={<OffersSkeleton />}>
            <OffersScreen />
        </Suspense>
    )
}
