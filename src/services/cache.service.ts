// ============================================================
// CACHE SERVICE — manages pre-baked demo responses
// Used to seed the demo account (Yara) before the hackathon pitch.
// On demo day, judges never see a spinner — everything loads from cache.
// ============================================================

import { CacheRepository } from '@/repositories/cache.repository'

export const CacheService = {

  /**
   * Pre-generate and cache everything for the demo account.
   * Call this once before the hackathon presentation.
   * profile_id should be Yara's profile ID.
   */
  async seedDemoAccount(profile_id: string): Promise<void> {
    // TODO: Call each service to generate + cache all responses
    // await RoadmapService.generate(profile_id)
    // await FundingService.scoreForProfile(profile_id)
    // await FinancialService.generate({ profile_id })
    console.log(`Demo cache seeded for profile: ${profile_id}`)
  },

  /**
   * Purge all expired cache entries.
   */
  async purgeExpired(): Promise<void> {
    await CacheRepository.purgeExpired()
  },

  /**
   * Invalidate all cached data for a specific profile.
   * Call after the user updates their profile.
   */
  async invalidateForProfile(profile_id: string): Promise<void> {
    await Promise.all([
      CacheRepository.delete(`roadmap:${profile_id}`),
      CacheRepository.delete(`funding:${profile_id}`),
      CacheRepository.delete(`snapshot:${profile_id}`),
    ])
  },

  /**
   * Get cache health stats.
   */
  async getStatus(): Promise<{ status: string; keys: string[] }> {
    // TODO: Query the response_cache table for active keys + hit rates
    return { status: 'ok', keys: [] }
  },
}
