import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

// Applying from 9itchi (letter, Gmail, 1-click) is sprint 4; until then this page says so and leads back to the offer.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const t = await getTranslations('offers')
    return (
        <main className="mx-auto flex w-full max-w-[640px] flex-col items-start gap-4 px-8 pb-16 pt-12">
            <h1 className="m-0 text-[36px] font-extrabold">{t('applySoonTitle')}</h1>
            <p className="m-0 text-base leading-relaxed text-ink-3">{t('applySoonText')}</p>
            <Link href={`/jobs/${encodeURIComponent(id)}`} className="text-sm font-semibold no-underline">
                {t('back')}
            </Link>
        </main>
    )
}
