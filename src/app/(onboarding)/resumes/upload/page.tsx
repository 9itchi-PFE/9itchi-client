import { Suspense } from 'react'
import OnboardingHeader from '@/components/layouts/StudentLayout/OnboardingHeader'
import ImportFlow from '@/components/resume/import/ImportFlow'

// Screens 1.2, 1.2b and 1.2c: import the CV, read it, show what was found.
export default function Page() {
    return (
        <>
            <OnboardingHeader step={2} />
            <Suspense>
                <ImportFlow />
            </Suspense>
        </>
    )
}
