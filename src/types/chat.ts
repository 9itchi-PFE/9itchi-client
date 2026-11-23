export type Conversation = { id: string; admin_id: string; user_id: string; unread_counts: Record<string, number> }
export type Message = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string }
