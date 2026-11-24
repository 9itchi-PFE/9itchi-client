import { Suspense } from 'react'
import TemplatePicker from '@/components/resume/TemplatePicker'

// Screen 4.3: choose one of the three CV templates.
export default function Page() {
    return (
        <Suspense>
            <TemplatePicker />
        </Suspense>
    )
}
