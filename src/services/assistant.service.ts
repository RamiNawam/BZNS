// ============================================================
// ASSISTANT SERVICE — business logic for the contextual AI assistant
// Orchestrates: build full context → call Claude → save messages
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { RoadmapRepository } from '@/repositories/roadmap.repository'
import { FundingRepository } from '@/repositories/funding.repository'
import { SnapshotRepository } from '@/repositories/snapshot.repository'
import { ChatRepository } from '@/repositories/chat.repository'
import type { ChatMessage, AssistantReply, CreateMessageDTO } from '@/types/chat'

// TODO: import { ClaudeClient } from '@/lib/claude/client'
// TODO: import { AssistantReplySchema } from '@/lib/claude/schemas'
// TODO: import { KnowledgeBaseSelector } from '@/lib/knowledge-base/selector'
// TODO: import { KnowledgeBaseLoader } from '@/lib/knowledge-base/loader'

export const AssistantService = {

  /**
   * Process a user message and return Claude's reply.
   *
   * Flow:
   * 1. Fetch full user context: profile + roadmap + funding + snapshot + last 10 messages
   * 2. Select relevant KB files based on message content + business_type
   * 3. Build the system prompt with all context injected
   * 4. Call Claude
   * 5. Validate reply with Zod
   * 6. Save both user message and assistant reply to DB
   * 7. Return reply
   */
  async chat(
    profile_id: string,
    user_message: string,
    session_id: string,
    context_type?: string
  ): Promise<AssistantReply> {

    // Step 1: Fetch all context in parallel
    const [profile, roadmapSteps, fundingMatches, snapshot, recentMessages] = await Promise.all([
      ProfileRepository.getById(profile_id),
      RoadmapRepository.getByProfileId(profile_id),
      FundingRepository.getByProfileId(profile_id),
      SnapshotRepository.getByProfileId(profile_id),
      ChatRepository.getLastN(profile_id, 10),
    ])

    if (!profile) throw new Error(`AssistantService.chat: Profile not found ${profile_id}`)

    // Step 2: Select KB files
    // TODO: Uncomment when KB selector is implemented
    // const kbFiles = KnowledgeBaseSelector.select(profile.business_type, user_message)
    // const knowledgeBase = KnowledgeBaseLoader.load(kbFiles)

    // Step 3 + 4: Call Claude with full context
    // TODO: Uncomment when Claude client is wired
    // const rawReply = await ClaudeClient.chat({
    //   profile,
    //   roadmapSteps,
    //   fundingMatches,
    //   snapshot,
    //   recentMessages,
    //   knowledgeBase,
    //   user_message,
    // })
    // const reply = AssistantReplySchema.parse(rawReply)

    // STUB reply until Claude is wired
    const reply: AssistantReply = {
      message: `Assistant stub: you asked "${user_message}" — Claude integration pending.`,
      sources: [],
      suggested_actions: [],
    }

    // Step 5: Save user message + assistant reply as a pair
    const userDTO: CreateMessageDTO = {
      profile_id,
      role: 'user',
      content: user_message,
      sources: null,
      context_type: context_type ?? null,
      session_id,
    }
    const assistantDTO: CreateMessageDTO = {
      profile_id,
      role: 'assistant',
      content: reply.message,
      sources: reply.sources.length > 0 ? reply.sources : null,
      context_type: context_type ?? null,
      session_id,
    }

    await ChatRepository.insertPair(userDTO, assistantDTO)

    return reply
  },

  /**
   * Fetch conversation history for a profile.
   */
  async getHistory(profile_id: string, limit: number = 50): Promise<ChatMessage[]> {
    return ChatRepository.getLastN(profile_id, limit)
  },

  /**
   * Clear the conversation history for a profile.
   */
  async clearHistory(profile_id: string): Promise<void> {
    return ChatRepository.clearByProfileId(profile_id)
  },
}
