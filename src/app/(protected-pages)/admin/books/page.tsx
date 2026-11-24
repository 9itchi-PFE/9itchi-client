import { getTranslations } from 'next-intl/server'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default async function Page() {
    const t = await getTranslations('admin')
    return <PagePlaceholder title={t('navBooks')} description={t('comingSoon')} />
}
