import type { Conversation, Message } from '@/types/chat'

// Viewer is who reads the thread: a student sees their own messages as theirs, the team sees the team's.
export type Viewer = 'student' | 'team'

// isMine says whether a message was written from the reader's side. Any sender other than the student is the team.
export function isMine(message: Pick<Message, 'sender_id'>, conversation: Pick<Conversation, 'user_id'>, viewer: Viewer): boolean {
    const fromStudent = message.sender_id === conversation.user_id
    return viewer === 'student' ? fromStudent : !fromStudent
}

export const MAX_MESSAGE = 4000

// draft is what is sent from what was typed: trimmed, or null when there is nothing to send or it is too long.
export function draft(typed: string): string | null {
    const text = typed.trim()
    return text.length > 0 && [...text].length <= MAX_MESSAGE ? text : null
}

// Day groups the messages of one calendar day (in the reader's time zone).
export type Day = { key: string; at: Date; messages: Message[] }

export function byDay(messages: Message[]): Day[] {
    const days: Day[] = []
    for (const m of messages) {
        const at = new Date(m.created_at)
        const key = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`
        const last = days[days.length - 1]
        if (last && last.key === key) last.messages.push(m)
        else days.push({ key, at, messages: [m] })
    }
    return days
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// picked reads which conversation the address bar asks for (?c=), when it is one of the list.
export function picked(param: string | null, conversations: Pick<Conversation, 'id'>[]): string {
    return param && uuid.test(param) && conversations.some((c) => c.id === param) ? param : ''
}
