// ============================================================
// PROFILE REPOSITORY — all DB operations for the profiles table
// No business logic here. Just Supabase queries.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { Profile, CreateProfileDTO, UpdateProfileDTO } from '@/types/profile'

export const ProfileRepository = {

  // Fetch a profile by Supabase auth user ID
  async getByUserId(user_id: string): Promise<Profile | null> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()
    if (error) return null
    return data as Profile
  },

  // Fetch a profile by its own primary key (profile_id)
  async getById(id: string): Promise<Profile | null> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as Profile
  },

  // Insert or update a profile (conflict on user_id)
  async upsert(profile: CreateProfileDTO): Promise<Profile> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw new Error(`ProfileRepository.upsert failed: ${error.message}`)
    return data as Profile
  },

  // Partial update by profile ID
  async update(id: string, updates: UpdateProfileDTO): Promise<Profile> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`ProfileRepository.update failed: ${error.message}`)
    return data as Profile
  },

  // Mark intake as complete
  async markIntakeComplete(id: string): Promise<void> {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('profiles')
      .update({ intake_completed: true, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(`ProfileRepository.markIntakeComplete failed: ${error.message}`)
  },
}
