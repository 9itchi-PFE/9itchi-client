import OnboardingHeader from '@/components/layouts/StudentLayout/OnboardingHeader'
import PreferencesFlow from '@/components/preferences/PreferencesFlow'

// Screen 1.3 « Ce que tu veux ».
export default function Page() {
    return (
        <>
            <OnboardingHeader step={3} />
            <PreferencesFlow />
        </>
    )
}
