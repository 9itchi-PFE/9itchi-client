'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useResumes } from '@/hooks/useResumes'

// /resumes opens the CV edited last (one that is not read-only), or the import when there is none yet.
export default function Page() {
    const t = useTranslations('common')
    const router = useRouter()
    const { data, isError } = useResumes()
    useEffect(() => {
        if (!data) return
        // The last edited one the student can still change, or the last edited when every one is read-only.
        const sorted = [...data.items].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        const last = sorted.find((r) => !r.locked) ?? sorted[0]
        router.replace(last ? `/resumes/${last.id}` : '/resumes/upload')
    }, [data, router])
    return <p className="mx-auto max-w-[1320px] px-4 sm:px-8 py-16 text-ink-3">{isError ? t('error') : t('loading')}</p>
}
