'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Field'
import { useMarkRead, useMessages, useSendMessage } from '@/hooks/useChat'
import { cn } from '@/lib/cn'
import type { Conversation } from '@/types/chat'
import { MAX_MESSAGE, byDay, draft, isMine, type Viewer } from './chat'

// Thread is one conversation: its messages day by day, and the field to answer. The reader's messages sit at the
// end of the line on a dark bubble, the other side's at the start on a white one.
export function Thread({ conversation, viewer, className }: { conversation: Conversation; viewer: Viewer; className?: string }) {
    const t = useTranslations('chat')
    const format = useFormatter()
    const { data: messages, isLoading, isError } = useMessages(conversation.id)
    const send = useSendMessage(conversation.id)
    const read = useMarkRead()
    const [typed, setTyped] = useState('')
    const [failed, setFailed] = useState(false)
    const end = useRef<HTMLDivElement>(null)
    const count = messages?.length ?? 0
    const lastId = messages?.[count - 1]?.id

    // A new message is shown: the thread follows it, and what was unread is read.
    const { mutate: markRead } = read
    useEffect(() => {
        if (!lastId) return
        end.current?.scrollIntoView({ block: 'end' })
        markRead(conversation.id)
    }, [lastId, conversation.id, markRead])

    const submit = (e?: FormEvent) => {
        e?.preventDefault()
        const text = draft(typed)
        if (!text || send.isPending) return
        setFailed(false)
        send.mutate(text, { onSuccess: () => setTyped(''), onError: () => setFailed(true) })
    }
    const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
        }
    }
    return (
        <div className={cn('flex min-h-0 flex-col', className)}>
            <div
                role="log"
                aria-live="polite"
                aria-label={t('messages')}
                className="flex min-h-[280px] flex-1 flex-col gap-4 overflow-y-auto bg-fill-3 px-5 py-5"
            >
                {isLoading ? <div className="sk h-12 w-2/3 rounded-2xl" /> : null}
                {isError ? <p className="m-0 text-sm text-[#B42318]">{t('loadError')}</p> : null}
                {messages && count === 0 ? (
                    <p className="m-auto max-w-[360px] text-center text-[14.5px] leading-[1.5] text-ink-3">
                        {t(viewer === 'student' ? 'emptyStudent' : 'emptyTeam')}
                    </p>
                ) : null}
                {byDay(messages ?? []).map((day) => (
                    <div key={day.key} className="flex flex-col gap-2.5">
                        <span className="self-center rounded-full bg-fill px-2.5 py-[3px] text-xs font-semibold text-ink-3">
                            {format.dateTime(day.at, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        {day.messages.map((m) => {
                            const mine = isMine(m, conversation, viewer)
                            return (
                                <div key={m.id} className={cn('flex max-w-[78%] flex-col gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
                                    <span className="sr-only">{mine ? t('fromMe') : t(viewer === 'student' ? 'fromTeam' : 'fromStudent')}</span>
                                    <p
                                        dir="auto"
                                        className={cn(
                                            'm-0 whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-[1.45] [overflow-wrap:anywhere]',
                                            mine ? 'bg-ink text-white' : 'border border-line bg-white text-ink',
                                        )}
                                    >
                                        {m.content}
                                    </p>
                                    <time dateTime={m.created_at} className="text-[11.5px] text-ink-3">
                                        {format.dateTime(new Date(m.created_at), { hour: '2-digit', minute: '2-digit' })}
                                    </time>
                                </div>
                            )
                        })}
                    </div>
                ))}
                <div ref={end} />
            </div>
            <form onSubmit={submit} className="flex flex-col gap-2 border-t border-line-soft bg-white p-4">
                {failed ? (
                    <p role="alert" className="m-0 text-sm text-[#B42318]">
                        {t('sendError')}
                    </p>
                ) : null}
                <div className="flex items-end gap-2.5">
                    <label className="min-w-0 flex-1">
                        <span className="sr-only">{t('write')}</span>
                        <TextArea
                            rows={2}
                            maxLength={MAX_MESSAGE}
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            onKeyDown={onKey}
                            placeholder={t('write')}
                            className="resize-none"
                        />
                    </label>
                    <Button type="submit" disabled={!draft(typed) || send.isPending}>
                        {t('send')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
