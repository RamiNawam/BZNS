// ============================================================
// CHAT REPOSITORY — all DB operations for the chat_messages table
// No business logic here. Just Supabase queries.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { ChatMessage, CreateMessageDTO } from '@/types/chat'

export const ChatRepository = {

  // Fetch the last N messages for a profile (for Claude's context window)
  async getLastN(profile_id: string, limit: number = 10): Promise<ChatMessage[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('profile_id', profile_id)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`ChatRepository.getLastN failed: ${error.message}`)
    // Reverse so oldest is first (correct order for Claude's messages array)
    return ((data ?? []) as ChatMessage[]).reverse()
  },

  // Fetch all messages for a specific session
  async getBySession(session_id: string): Promise<ChatMessage[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`ChatRepository.getBySession failed: ${error.message}`)
    return (data ?? []) as ChatMessage[]
  },

  // Insert a single message (user or assistant)
  async insert(message: CreateMessageDTO): Promise<ChatMessage> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single()
    if (error) throw new Error(`ChatRepository.insert failed: ${error.message}`)
    return data as ChatMessage
  },

  // Insert user + assistant messages together (always saved as a pair)
  async insertPair(
    userMessage: CreateMessageDTO,
    assistantMessage: CreateMessageDTO
  ): Promise<ChatMessage[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([userMessage, assistantMessage])
      .select()
    if (error) throw new Error(`ChatRepository.insertPair failed: ${error.message}`)
    return (data ?? []) as ChatMessage[]
  },

  // Clear all messages for a profile (reset conversation)
  async clearByProfileId(profile_id: string): Promise<void> {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('profile_id', profile_id)
    if (error) throw new Error(`ChatRepository.clearByProfileId failed: ${error.message}`)
  },
}
