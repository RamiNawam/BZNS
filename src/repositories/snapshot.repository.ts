// ============================================================
// SNAPSHOT REPOSITORY — all DB operations for the financial_snapshots table
// No business logic here. Just Supabase queries.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { FinancialSnapshot, CreateSnapshotDTO } from '@/types/financial'

export const SnapshotRepository = {

  // Fetch the snapshot for a profile (one per user)
  async getByProfileId(profile_id: string): Promise<FinancialSnapshot | null> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('financial_snapshots')
      .select('*')
      .eq('profile_id', profile_id)
      .single()
    if (error) return null
    return data as FinancialSnapshot
  },

  // Insert or replace snapshot (only one per profile — conflict on profile_id)
  async upsert(snapshot: CreateSnapshotDTO): Promise<FinancialSnapshot> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('financial_snapshots')
      .upsert(
        { ...snapshot, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id' }
      )
      .select()
      .single()
    if (error) throw new Error(`SnapshotRepository.upsert failed: ${error.message}`)
    return data as FinancialSnapshot
  },

  // Delete a snapshot (force recalculation)
  async deleteByProfileId(profile_id: string): Promise<void> {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('financial_snapshots')
      .delete()
      .eq('profile_id', profile_id)
    if (error) throw new Error(`SnapshotRepository.deleteByProfileId failed: ${error.message}`)
  },
}
