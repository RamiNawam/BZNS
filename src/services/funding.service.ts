// ============================================================
// FUNDING SERVICE — business logic for funding program matching
// Orchestrates: fetch profile → load KB → run scorer → save matches
// NOTE: Scoring is fully deterministic — no Claude involved here.
// Claude is only called if the user clicks "explain this program."
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { FundingRepository } from '@/repositories/funding.repository'
import { CacheRepository } from '@/repositories/cache.repository'
import type { FundingMatch, CreateFundingMatchDTO, UpdateFundingMatchDTO } from '@/types/funding'

// TODO: import { FundingScorer } from '@/lib/funding/scorer'
// TODO: import { KnowledgeBaseLoader } from '@/lib/knowledge-base/loader'
// TODO: import { ClaudeClient } from '@/lib/claude/client'

export const FundingService = {

  /**
   * Run the deterministic funding scorer for a user.
   * 1. Fetch profile
   * 2. Check cache
   * 3. Load all funding JSON files from /data/funding/
   * 4. Score each program against the profile (0-100)
   * 5. Filter out score = 0, sort descending
   * 6. Save to DB + cache
   * 7. Return matches with total_potential_funding
   */
  async scoreForProfile(profile_id: string): Promise<{
    matches: FundingMatch[]
    total_potential_funding: string
  }> {
    const cacheKey = `funding:${profile_id}`

    // Check cache first
    const cached = await CacheRepository.get<{ matches: FundingMatch[]; total_potential_funding: string }>(cacheKey)
    if (cached) return cached

    // Fetch the user's profile
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`FundingService.scoreForProfile: Profile not found ${profile_id}`)

    // TODO: Load all funding programs from /data/funding/*.json
    // const programs = KnowledgeBaseLoader.loadFundingPrograms()

    // TODO: Score each program deterministically
    // const scoredMatches = FundingScorer.scoreAll(profile, programs)
    // const filtered = scoredMatches.filter(m => m.match_score > 0)

    // TODO: Map scorer output → DB DTOs
    // const matchDTOs: CreateFundingMatchDTO[] = filtered.map(m => ({
    //   profile_id,
    //   program_key: m.program_key,
    //   program_name: m.program_name,
    //   program_type: m.program_type,
    //   amount_description: m.amount_description,
    //   match_score: m.match_score,
    //   eligibility_details: m.eligibility_details,
    //   summary: m.summary,
    //   application_url: m.application_url,
    //   source_url: m.source_url,
    //   is_bookmarked: false,
    //   is_dismissed: false,
    // }))

    // STUB until scorer is wired
    const matchDTOs: CreateFundingMatchDTO[] = []

    // Save to DB
    const savedMatches = matchDTOs.length > 0
      ? await FundingRepository.batchUpsert(matchDTOs)
      : []

    // Calculate total potential funding (for the "$95,000+ available" demo moment)
    const total_potential_funding = '$0'
    // TODO: replace with real calc from savedMatches

    const result = { matches: savedMatches, total_potential_funding }
    await CacheRepository.set(cacheKey, result)

    return result
  },

  /**
   * Fetch previously scored matches (no rescoring).
   */
  async getByProfileId(profile_id: string): Promise<FundingMatch[]> {
    return FundingRepository.getByProfileId(profile_id)
  },

  /**
   * Ask Claude to explain a specific program in plain language.
   * Only called when user clicks "tell me more" on a funding card.
   */
  async explainProgram(profile_id: string, program_key: string): Promise<string> {
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`FundingService.explainProgram: Profile not found`)

    // TODO: Load the specific program JSON
    // const program = KnowledgeBaseLoader.loadFundingProgram(program_key)

    // TODO: Call Claude to explain it in the user's language
    // const explanation = await ClaudeClient.explainFundingProgram(profile, program)
    // return explanation

    return `Explanation for ${program_key} — Claude integration pending`
  },

  /**
   * Bookmark or dismiss a funding match.
   */
  async updateMatch(
    match_id: string,
    update: UpdateFundingMatchDTO
  ): Promise<FundingMatch> {
    return FundingRepository.update(match_id, update)
  },
}
