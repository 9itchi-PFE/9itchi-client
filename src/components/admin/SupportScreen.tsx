'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { picked } from '@/components/chat/chat'
import { Thread } from '@/components/chat/Thread'
import { useLiveChat } from '@/components/chat/useLiveChat'
import { initials } from '@/components/layouts/StudentLayout/AccountMenu'
import { useAdminUser } from '@/hooks/useAdminUsers'
import { useConversations } from '@/hooks/useChat'
import { cn } from '@/lib/cn'
import type { Conversation } from '@/types/chat'

// Who is the name of the student of a conversation, read from account-api (kept for the visit).
function useWho(userId: string) {
    const { data } = useAdminUser(userId)
    return { name: data?.name || data?.email || '', school: data?.school ?? '' }
}

function InboxRow({ conversation, active, onPick }: { conversation: Conversation; active: boolean; onPick: () => void }) {
    const t = useTranslations('chat')
    const who = useWho(conversation.user_id)
    const unread = conversation.unread_count > 0
    return (
        <li>
            <button
                type="button"
                onClick={onPick}
                aria-current={active ? 'true' : undefined}
                className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-[14px] border-0 p-2.5 text-start',
                    active ? 'bg-fill' : 'bg-transparent hover:bg-fill-3',
                )}
            >
                <span
                    aria-hidden
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-violet-soft text-[13px] font-bold text-violet-hover"
                >
                    {initials(who.name)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                    <bdi className={cn('truncate text-[14.5px]', unread ? 'font-extrabold' : 'font-bold')}>{who.name || t('student')}</bdi>
                    <bdi className="truncate text-[13px] text-ink-3">{conversation.last_message?.content ?? t('noMessage')}</bdi>
                </span>
                {unread ? (
                    <span className="flex-none">
                        <span aria-hidden className="block h-2.5 w-2.5 rounded-full bg-violet" />
                        <span className="sr-only">{t('unread', { count: conversation.unread_count })}</span>
                    </span>
                ) : null}
            </button>
        </li>
    )
}

function Open({ conversation }: { conversation: Conversation }) {
    const t = useTranslations('chat')
    const who = useWho(conversation.user_id)
    return (
        <>
            <section
                aria-label={who.name || t('student')}
                className="flex h-[640px] min-w-0 flex-col overflow-hidden rounded-[22px] border-[1.5px] border-ink bg-white shadow-card"
            >
                <h2 className="m-0 border-b border-line-soft px-5 py-4 text-[17px] font-extrabold">
                    <bdi>{who.name || t('student')}</bdi>
                </h2>
                <Thread key={conversation.id} conversation={conversation} viewer="team" className="flex-1" />
            </section>
            <aside className="flex flex-col gap-2 rounded-[22px] border border-line bg-white p-5">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-ink-3">{t('student')}</span>
                <strong className="text-[17px]">
                    <bdi>{who.name || '–'}</bdi>
                </strong>
                {who.school ? <span className="text-[14.5px] text-ink-3">{who.school}</span> : null}
                <Link href={`/admin/users/${conversation.user_id}`} className="mt-1 text-[15px] font-semibold text-violet no-underline hover:text-violet-hover">
                    {t('openFile')}{' '}
                    <span aria-hidden className="inline-block rtl:-scale-x-100">
                        →
                    </span>
                </Link>
            </aside>
        </>
    )
}

// SupportScreen is « Support »: the inbox of the team. Every student's conversation, the one written to last
// first; any admin reads and answers.
export default function SupportScreen() {
    const t = useTranslations('chat')
    const router = useRouter()
    const params = useSearchParams()
    const { data, isLoading, isError } = useConversations()
    const items = data?.items ?? []
    useLiveChat(items.map((c) => c.id))
    const id = picked(params.get('c'), items) || items[0]?.id || ''
    const open = items.find((c) => c.id === id)
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('inboxTitle')}</h1>
                <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('inboxSubtitle')}</p>
            </div>
            {isError ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('inboxError')}
                </p>
            ) : null}
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
                <nav aria-label={t('conversations')} className="rounded-[22px] border border-line bg-white p-2.5">
                    {isLoading ? <div className="sk m-2 h-12 rounded-lg" /> : null}
                    {data && items.length === 0 ? <p className="m-0 p-3 text-sm text-ink-3">{t('inboxEmpty')}</p> : null}
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                        {items.map((c) => (
                            <InboxRow
                                key={c.id}
                                conversation={c}
                                active={c.id === id}
                                onPick={() => router.replace(`/admin/support?c=${c.id}`, { scroll: false })}
                            />
                        ))}
                    </ul>
                </nav>
                {open ? <Open conversation={open} /> : null}
            </div>
        </div>
    )
}
