import { getTranslations } from 'next-intl/server'
import OnboardingHeader from '@/components/layouts/StudentLayout/OnboardingHeader'
import { ButtonLink } from '@/components/ui/Button'

// Step 3 (screen 1.3) is designed but not built yet: this keeps « Continuer » from leading nowhere.
export default async function Page() {
    const t = await getTranslations('wishes')
    const tc = await getTranslations('import')
    return (
        <>
            <OnboardingHeader step={3} />
            <main className="mx-auto flex max-w-[720px] flex-col items-center gap-4 px-6 pt-16 text-center">
                <h1 className="m-0 text-[44px] font-extrabold">{t('title')}</h1>
                <p className="m-0 text-[17px] text-ink-3">{t('text')}</p>
                <ButtonLink href="/resumes" size="lg">
                    {tc('review')}
                </ButtonLink>
            </main>
        </>
    )
}
