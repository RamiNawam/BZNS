// ============================================================
// CHAT TYPES — mirrors the `chat_messages` table in Supabase
// ============================================================

export type MessageRole = 'user' | 'assistant'

// Full DB row — 1:1 with chat_messages table
export interface ChatMessage {
  id: string
  profile_id: string
  created_at: string

  role: MessageRole
  content: string
  sources: string[] | null        // KB file names cited e.g. ['qpp.json', 'gst_qst.json']
  context_type: string | null     // which screen the message came from
  session_id: string
}

// A cited source displayed in the chat UI
export interface SourceCitation {
  label: string       // display name e.g. "GST/QST Guide"
  url?: string        // optional link to the source
}

// What Claude returns for an assistant reply (validated by Zod)
export interface AssistantReply {
  message: string
  sources: string[]
  suggested_actions: string[]
}

// DTOs
export type CreateMessageDTO = Omit<ChatMessage, 'id' | 'created_at'>

// State shape for the chat Zustand store
export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  session_id: string | null
}
