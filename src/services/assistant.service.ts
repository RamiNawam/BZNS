// ============================================================
// ASSISTANT SERVICE — business logic for the contextual AI assistant
// Orchestrates: build full context → call Claude → save messages
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { RoadmapService } from '@/services/roadmap.service'
import { FundingRepository } from '@/repositories/funding.repository'
import { SnapshotRepository } from '@/repositories/snapshot.repository'
import { ChatRepository } from '@/repositories/chat.repository'
import { getAnthropicClient } from '@/lib/claude/client'
import { loadKnowledgeBase, serializeForPrompt } from '@/lib/knowledge-base/loader'
import { selectForAssistant, contextFromProfile } from '@/lib/knowledge-base/selector'
import { buildAssistantPrompt } from '@/lib/knowledge-base/prompts'
import type { UserProfile, RoadmapItem, FinancialSnapshot as PromptSnapshot, ChatMessage as PromptChatMessage } from '@/lib/knowledge-base/prompts'
import type { AssistantReply, CreateMessageDTO } from '@/types/chat'

export const AssistantService = {

  async chat(
    profile_id: string,
    user_message: string,
    session_id: string,
    context_type?: string,
    page_context?: string,
    _context_data?: { roadmap_steps?: unknown[]; financial_snapshot?: unknown; funding_matches?: unknown[] },
  ): Promise<AssistantReply> {

    // Step 1: Fetch all context in parallel
    const [profile, roadmapResult, fundingMatches, snapshot, recentMessages, kb] = await Promise.all([
      ProfileRepository.getById(profile_id),
      RoadmapService.getByProfileId(profile_id),
      FundingRepository.getByProfileId(profile_id),
      SnapshotRepository.getByProfileId(profile_id),
      ChatRepository.getLastN(profile_id, 10),
      loadKnowledgeBase(),
    ])
    // Includes verified + flagged + inferred steps (matches what the roadmap page shows)
    const roadmapSteps = roadmapResult.steps

    if (!profile) throw new Error(`AssistantService.chat: Profile not found ${profile_id}`)

    // Step 2: Build spending intelligence from snapshot
    let spendingContext = 'No financial data available yet.'
    if (snapshot) {
      const monthlyRev = snapshot.gross_monthly_revenue ?? 0
      const monthlyExp = snapshot.monthly_expenses ?? 0
      const takeHome = snapshot.monthly_take_home ?? 0
      const annualRev = snapshot.annual_revenue ?? monthlyRev * 12
      const gstThreshold = 30000
      const weeksToThreshold = annualRev > 0 && annualRev < gstThreshold
        ? Math.round(((gstThreshold - annualRev) / (monthlyRev * 12)) * 52)
        : null

      spendingContext = [
        `Monthly revenue: $${monthlyRev.toLocaleString()}`,
        `Monthly expenses: $${monthlyExp.toLocaleString()}`,
        `Monthly take-home: $${(takeHome ?? 0).toLocaleString()}`,
        `Annual revenue pace: $${annualRev.toLocaleString()}`,
        monthlyRev > 0
          ? `Expense-to-revenue ratio: ${Math.round((monthlyExp / monthlyRev) * 100)}%`
          : null,
        weeksToThreshold != null && weeksToThreshold > 0 && weeksToThreshold <= 52
          ? `Weeks until $30K GST/QST threshold at current pace: ~${weeksToThreshold}`
          : null,
      ].filter(Boolean).join('\n')
    }

    // Step 3: Map DB profile → prompt UserProfile
    const userProfile: UserProfile = {
      business_type: profile.business_type,
      industry_sector: profile.industry_sector ?? 'general',
      is_home_based: profile.is_home_based,
      serves_alcohol: false, // inferred by contextFromProfile below
      is_regulated_profession: false, // inferred by contextFromProfile below
      stage: 'starting',
      expected_revenue_cad: profile.expected_monthly_revenue != null
        ? profile.expected_monthly_revenue * 12
        : null,
      employee_count: profile.num_employees ?? null,
      location: profile.municipality ?? 'montreal',
      age: profile.age ?? null,
      is_newcomer: profile.immigration_status === 'work_permit' || profile.immigration_status === 'student',
      is_indigenous: false,
      is_woman: profile.gender === 'woman' || profile.gender === 'female',
      business_summary: profile.business_description ?? `${profile.business_type} business`,
    }

    // Step 4: Select KB docs and serialize
    const selectionContext = contextFromProfile(userProfile)
    const kbDocs = selectForAssistant(kb, selectionContext)
    const kbJson = serializeForPrompt(kbDocs)

    // Step 4: Map DB types to prompt types
    const roadmapItems: RoadmapItem[] = roadmapSteps.map((s, i) => ({
      step_number: s.step_order ?? i + 1,
      title: s.title,
      description: s.description ?? '',
      urgency: (s.confidence === 'inferred' ? 'recommended' : 'required') as RoadmapItem['urgency'],
      source_id: s.source ?? undefined,
      action_url: s.government_url ?? undefined,
      completed: s.status === 'completed',
    }))

    const promptSnapshot: PromptSnapshot = snapshot
      ? {
          revenue_ytd: (snapshot.annual_revenue ?? (snapshot.gross_monthly_revenue ?? 0) * 12),
          expenses_ytd: (snapshot.monthly_expenses ?? 0) * 12,
          net_income_ytd: (snapshot.net_revenue ?? 0),
          gst_qst_collected_ytd: (snapshot.gst_collected ?? 0) + (snapshot.qst_collected ?? 0),
          last_updated: snapshot.updated_at ?? snapshot.created_at,
        }
      : {
          revenue_ytd: 0,
          expenses_ytd: 0,
          net_income_ytd: 0,
          gst_qst_collected_ytd: 0,
          last_updated: 'N/A',
        }

    const fundingForPrompt = fundingMatches.map((f) => ({
      id: f.id,
      program_name_en: f.program_name,
      plain_language_summary: f.summary ?? '',
      amount: {
        note: f.amount_description ?? undefined,
      },
      application_url: f.application_url ?? undefined,
    }))

    const historyForPrompt: PromptChatMessage[] = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Step 5: Build system prompt (includes page context, spending, proactive flags)
    const systemPrompt = buildAssistantPrompt(
      userProfile,
      roadmapItems,
      fundingForPrompt,
      promptSnapshot,
      historyForPrompt,
      kbJson,
      page_context,
      spendingContext,
    )

    // Step 6: Build multi-turn messages array for Claude
    // Include recent DB messages + the new user message
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const m of recentMessages) {
      claudeMessages.push({ role: m.role, content: m.content })
    }
    claudeMessages.push({ role: 'user', content: user_message })

    // Ensure conversation starts with a user message (Anthropic API requirement)
    if (claudeMessages.length > 0 && claudeMessages[0].role !== 'user') {
      claudeMessages.shift()
    }

    // Step 7: Call Claude
    const client = getAnthropicClient()
    console.log(`[Assistant] Calling Claude haiku | system_chars=${systemPrompt.length} | messages=${claudeMessages.length}`)
    const start = Date.now()

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const elapsed = Date.now() - start
    console.log(`[Assistant] Done in ${elapsed}ms | input=${response.usage.input_tokens} output=${response.usage.output_tokens}`)

    const block = response.content[0]
    if (block.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const replyMessage = block.text

    const reply: AssistantReply = {
      message: replyMessage,
      sources: [],
      suggested_actions: [],
    }

    // Step 8: Save user message + assistant reply as a pair
    const userDTO: CreateMessageDTO = {
      profile_id,
      role: 'user',
      content: user_message,
      sources: null,
      context_type: context_type ?? page_context ?? null,
      session_id,
    }
    const assistantDTO: CreateMessageDTO = {
      profile_id,
      role: 'assistant',
      content: reply.message,
      sources: null,
      context_type: context_type ?? page_context ?? null,
      session_id,
    }

    await ChatRepository.insertPair(userDTO, assistantDTO)

    return reply
  },

  async getHistory(profile_id: string, limit: number = 50) {
    return ChatRepository.getLastN(profile_id, limit)
  },

  async clearHistory(profile_id: string): Promise<void> {
    return ChatRepository.clearByProfileId(profile_id)
  },
}
