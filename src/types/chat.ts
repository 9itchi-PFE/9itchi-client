// chat-api: support is a team inbox. A student has one conversation with the team; admin_id is the seat of the
// team, the same for every conversation. A message keeps who wrote it: any sender other than the student is the team.
export type MessagePreview = { content: string; sender_id: string; created_at: string }

export type Conversation = {
    id: string
    admin_id: string
    user_id: string
    // unread_count is the caller's: the team's for an admin, their own for a student.
    unread_count: number
    last_message: MessagePreview | null
    updated_at: string
    created_at: string
}

export type ConversationList = { items: Conversation[]; total: number; page: number; page_size: number }

export type Message = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string }

// Messages come newest first.
export type MessageList = { items: Message[]; total: number; page: number; page_size: number }
