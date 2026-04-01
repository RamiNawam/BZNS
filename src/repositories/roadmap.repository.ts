// ============================================================
// ROADMAP REPOSITORY — all DB operations for the roadmap_steps table
// No business logic here. Just Supabase queries.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { RoadmapStep, CreateRoadmapStepDTO, UpdateStepStatusDTO } from '@/types/roadmap'

export const RoadmapRepository = {

  // Fetch all steps for a profile, ordered by step_order
  async getByProfileId(profile_id: string): Promise<RoadmapStep[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('roadmap_steps')
      .select('*')
      .eq('profile_id', profile_id)
      .order('step_order', { ascending: true })
    if (error) throw new Error(`RoadmapRepository.getByProfileId failed: ${error.message}`)
    return (data ?? []) as RoadmapStep[]
  },

  // Fetch a single step by its step_key (e.g. 'req_registration')
  async getByStepKey(profile_id: string, step_key: string): Promise<RoadmapStep | null> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('roadmap_steps')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('step_key', step_key)
      .single()
    if (error) return null
    return data as RoadmapStep
  },

  // Insert multiple steps at once (Claude generates all steps in one call)
  async batchUpsert(steps: CreateRoadmapStepDTO[]): Promise<RoadmapStep[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('roadmap_steps')
      .upsert(steps, { onConflict: 'profile_id,step_key' })
      .select()
    if (error) throw new Error(`RoadmapRepository.batchUpsert failed: ${error.message}`)
    return (data ?? []) as RoadmapStep[]
  },

  // Update the status of a single step (user marks it done/in-progress/skipped)
  async updateStatus(id: string, update: UpdateStepStatusDTO): Promise<RoadmapStep> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('roadmap_steps')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`RoadmapRepository.updateStatus failed: ${error.message}`)
    return data as RoadmapStep
  },

  // Delete all steps for a profile (before regenerating)
  async deleteByProfileId(profile_id: string): Promise<void> {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('roadmap_steps')
      .delete()
      .eq('profile_id', profile_id)
    if (error) throw new Error(`RoadmapRepository.deleteByProfileId failed: ${error.message}`)
  },
}
