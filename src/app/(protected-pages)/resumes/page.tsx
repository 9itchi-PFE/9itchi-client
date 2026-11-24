'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useResumes } from '@/hooks/useResumes'

// /resumes opens the CV edited last, or the import when there is none yet.
export default function Page() {
    const t = useTranslations('common')
    const router = useRouter()
    const { data, isError } = useResumes()
    useEffect(() => {
        if (!data) return
        const last = [...data.items].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
        router.replace(last ? `/resumes/${last.id}` : '/resumes/upload')
    }, [data, router])
    return <p className="mx-auto max-w-[1320px] px-8 py-16 text-ink-3">{isError ? t('error') : t('loading')}</p>
}
