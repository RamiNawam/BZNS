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
} from '@/types/profile'
import { CLUSTERS } from '@/lib/clusters'
import { classifyBusiness } from '@/lib/classifier'

export const ProfileService = {

  /**
   * Called after the user completes the 8-question intake wizard.
   * 1. Classifies business deterministically from answers (no Claude API needed)
   * 2. Merges cluster info with intake answers
   * 3. Upserts into the profiles table
   */
  async createFromIntake(user_id: string, answers: IntakeAnswers): Promise<Profile> {
    console.log(`[ProfileService.createFromIntake] START user_id=${user_id} business_idea="${answers.business_idea?.slice(0, 60)}"`)

    // Step 1: Classify business from intake answers (decision tree, no AI)
    const clusterId = classifyBusiness({
      business_activity: answers.business_activity,
      work_location: answers.work_location,
      license_type: answers.license_type,
      pricing_model: answers.pricing_model,
    })
    const clusterMeta = CLUSTERS[clusterId]
    console.log(`[ProfileService.createFromIntake] Classified as cluster=${clusterId} (${clusterMeta.label})`)

    // Step 2: Derive business_type + industry_sector from cluster
    const CLUSTER_TO_TYPE: Record<string, 'food' | 'freelance' | 'daycare' | 'retail' | 'personal_care' | 'other'> = {
      C1: 'food', C2: 'freelance', C3: 'daycare',
      C4: 'other', C5: 'retail', C6: 'retail',
      C7: 'food', C8: 'other', C9: 'personal_care',
      C10: 'other', C11: 'freelance', C12: 'other',
    }
    const CLUSTER_TO_SECTOR: Record<string, string> = {
      C1: 'home-based food', C2: 'freelance & digital', C3: 'regulated childcare',
      C4: 'regulated profession', C5: 'online retail', C6: 'physical retail',
      C7: 'restaurant & food service', C8: 'construction & trades', C9: 'personal care & beauty',
      C10: 'fitness & wellness', C11: 'creative & media', C12: 'education & tutoring',
    }
    const businessType = CLUSTER_TO_TYPE[clusterId] ?? 'other'
    const industrySector = CLUSTER_TO_SECTOR[clusterId] ?? 'general'
    console.log(`[ProfileService.createFromIntake] business_type=${businessType} sector=${industrySector}`)

    // Step 3: Build the profile DTO
    const isHomeBased = answers.work_location === 'home' || answers.is_home_based
    const profileDTO: CreateProfileDTO = {
      user_id,
      business_type: businessType,
      business_name: answers.business_name || null,
      business_description: answers.business_idea,
      industry_sector: industrySector,
      municipality: answers.location,
      borough: answers.borough ?? null,
      is_home_based: isHomeBased,
      has_physical_location: !isHomeBased,
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
