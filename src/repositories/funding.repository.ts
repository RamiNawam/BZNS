// ============================================================
// FUNDING REPOSITORY — all DB operations for the funding_matches table
// No business logic here. Just Supabase queries.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { FundingMatch, CreateFundingMatchDTO, UpdateFundingMatchDTO } from '@/types/funding'

export const FundingRepository = {

  // Fetch all matches for a profile, sorted by score descending
  async getByProfileId(profile_id: string): Promise<FundingMatch[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('funding_matches')
      .select('*')
      .eq('profile_id', profile_id)
      .order('match_score', { ascending: false })
    if (error) throw new Error(`FundingRepository.getByProfileId failed: ${error.message}`)
    return (data ?? []) as FundingMatch[]
  },

  // Fetch only bookmarked matches
  async getBookmarked(profile_id: string): Promise<FundingMatch[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('funding_matches')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('is_bookmarked', true)
      .order('match_score', { ascending: false })
    if (error) throw new Error(`FundingRepository.getBookmarked failed: ${error.message}`)
    return (data ?? []) as FundingMatch[]
  },

  // Delete all matches for a profile (called before force-refresh to reset created_at)
  async deleteByProfileId(profile_id: string): Promise<void> {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('funding_matches')
      .delete()
      .eq('profile_id', profile_id)
    if (error) throw new Error(`FundingRepository.deleteByProfileId failed: ${error.message}`)
  },

  // Upsert all scored matches at once (scorer runs all programs in one pass)
  async batchUpsert(matches: CreateFundingMatchDTO[]): Promise<FundingMatch[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('funding_matches')
      .upsert(matches, { onConflict: 'profile_id,program_key' })
      .select()
    if (error) throw new Error(`FundingRepository.batchUpsert failed: ${error.message}`)
    return (data ?? []) as FundingMatch[]
  },

  // Toggle bookmark or dismiss on a single match
  async update(id: string, update: UpdateFundingMatchDTO): Promise<FundingMatch> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('funding_matches')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`FundingRepository.update failed: ${error.message}`)
    return data as FundingMatch
  },
}
