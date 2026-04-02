// ============================================================
// PROFILE SERVICE — business logic for user profile management
// Orchestrates: intake validation → Claude classification → DB save
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import type {
  Profile,
  IntakeAnswers,
  CreateProfileDTO,
  UpdateProfileDTO,
  BusinessType,
} from '@/types/profile'
import { CLUSTERS } from '@/lib/clusters'
import type { ClusterID } from '@/lib/clusters'

// TODO: import { ClaudeClient } from '@/lib/claude/client'
// TODO: import { ProfileResponseSchema } from '@/lib/claude/schemas'

export const ProfileService = {

  /**
   * Called after the user completes the 8-question intake wizard.
   * 1. Sends raw answers to Claude → classifies business type, sector, name
   * 2. Merges Claude output with intake answers
   * 3. Upserts into the profiles table
   */
  async createFromIntake(user_id: string, answers: IntakeAnswers): Promise<Profile> {
    // Step 1: Call Claude to classify the business
    // TODO: Uncomment when Claude client is wired up
    // const rawJson = await ClaudeClient.complete(buildProfilePrompt(answers as Record<string, unknown>))
    // const claudeResult = ProfileResponseSchema.parse(JSON.parse(rawJson))
    // const { business_type, industry_sector, business_name, business_description, cluster_id: claudeClusterId } = claudeResult

    // Step 1b: Stub cluster until Claude is live — default to C9
    const clusterId: ClusterID = 'C9'                    // TODO: replace with claudeClusterId
    const clusterMeta = CLUSTERS[clusterId]

    // Step 2: Build the profile DTO (using stubs until Claude is live)
    const profileDTO: CreateProfileDTO = {
      user_id,
      business_type: 'other' as BusinessType,            // TODO: replace with claudeResult.business_type
      business_name: null,                                // TODO: replace with claudeResult.business_name
      business_description: null,                         // TODO: replace with claudeResult.business_description
      industry_sector: null,                              // TODO: replace with claudeResult.industry_sector
      municipality: answers.location,
      borough: answers.borough ?? null,
      is_home_based: answers.is_home_based,
      has_physical_location: !answers.is_home_based,
      full_name: null,
      age: answers.age,
      immigration_status: answers.immigration_status,
      gender: null,
      languages_spoken: answers.languages,
      preferred_language: answers.preferred_language,
      business_structure: null,
      has_partners: answers.has_partners,
      num_employees: 0,
      expected_monthly_revenue: answers.expected_monthly_revenue,
      startup_budget: null,
      has_neq: false,
      has_gst_qst: false,
      monthly_expenses: null,
      expense_categories: null,
      price_per_unit: null,
      units_per_month: null,
      intake_completed: true,
      intake_answers: answers as unknown as Record<string, unknown>,
      // Cluster — set by Claude; using default until API is wired
      cluster_id: clusterId,
      cluster_label: clusterMeta.label,
      cluster_complexity: clusterMeta.complexity,
    }

    // Step 3: Save to DB
    return ProfileRepository.upsert(profileDTO)
  },

  /**
   * Fetch a profile by auth user ID.
   * Returns null if the user hasn't completed intake yet.
   */
  async getByUserId(user_id: string): Promise<Profile | null> {
    return ProfileRepository.getByUserId(user_id)
  },

  /**
   * Fetch a profile by its profile ID (used internally by other services).
   */
  async getById(profile_id: string): Promise<Profile> {
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`Profile not found: ${profile_id}`)
    return profile
  },

  /**
   * Update specific fields on a profile (e.g. financial inputs from dashboard).
   */
  async update(profile_id: string, updates: UpdateProfileDTO): Promise<Profile> {
    return ProfileRepository.update(profile_id, updates)
  },
}
