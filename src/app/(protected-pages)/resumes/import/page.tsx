import { Suspense } from 'react'
import ImportFlow from '@/components/resume/import/ImportFlow'

// Import one more CV for a student who already has one: no stepper, the new CV opens in the editor once read.
export default function Page() {
    return (
        <Suspense>
            <ImportFlow mode="add" />
        </Suspense>
    )
}
