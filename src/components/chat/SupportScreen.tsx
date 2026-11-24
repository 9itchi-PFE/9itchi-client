'use client'

import { useTranslations } from 'next-intl'
import { useSupport } from '@/hooks/useChat'
import { Thread } from './Thread'
import { useLiveChat } from './useLiveChat'

// SupportScreen is « Aide »: the student's conversation with the 9itchi team.
export default function SupportScreen() {
    const t = useTranslations('chat')
    const { data: conversation, isLoading, isError } = useSupport()
    useLiveChat(conversation ? [conversation.id] : [])
    return (
        <main className="mx-auto box-border flex w-full max-w-[820px] flex-1 flex-col gap-[22px] px-8 pb-[72px] pt-4">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[44px] font-extrabold leading-[1.05]">{t('helpTitle')}</h1>
                <p className="m-0 text-base leading-[1.55] text-ink-3">{t('helpSubtitle')}</p>
            </div>
            {isLoading ? <div className="sk h-[420px] w-full rounded-[22px]" /> : null}
            {isError ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('helpError')}
                </p>
            ) : null}
            {conversation ? (
                <section
                    aria-label={t('helpTitle')}
                    className="flex h-[560px] flex-col overflow-hidden rounded-[22px] border-[1.5px] border-ink bg-white shadow-card"
                >
                    <Thread conversation={conversation} viewer="student" className="flex-1" />
                </section>
            ) : null}
        </main>
    )
}
