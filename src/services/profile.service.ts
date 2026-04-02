// ============================================================
// PROFILE SERVICE — business logic for user profile management
// Orchestrates: intake validation → Claude classification → DB save
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { askClaude } from '@/lib/claude/client'
import { buildProfilePrompt } from '@/lib/knowledge-base/prompts'
import { ProfileClassificationSchema, parseClaudeJSON } from '@/lib/claude/schemas'
import type {
  Profile,
  IntakeAnswers,
  CreateProfileDTO,
  UpdateProfileDTO,
} from '@/types/profile'
import type { IntakeAnswers as PromptIntakeAnswers } from '@/lib/knowledge-base/prompts'

export const ProfileService = {

  /**
   * Called after the user completes the 8-question intake wizard.
   * 1. Sends raw answers to Claude → classifies business type, sector, name
   * 2. Merges Claude output with intake answers
   * 3. Upserts into the profiles table
   */
  async createFromIntake(user_id: string, answers: IntakeAnswers): Promise<Profile> {
    console.log(`[ProfileService.createFromIntake] START user_id=${user_id} business_idea="${answers.business_idea?.slice(0, 60)}"`)

    // Step 1: Map intake answers to the shape buildProfilePrompt expects
    const promptAnswers: PromptIntakeAnswers = {
      business_description: answers.business_idea,
      location: answers.location,
      stage: 'starting',
      expected_revenue_cad: answers.expected_monthly_revenue ? answers.expected_monthly_revenue * 12 : null,
      employee_count: answers.has_partners ? 2 : 1,
      serves_alcohol: false,
      is_home_based: answers.is_home_based,
      is_regulated_profession: false,
      age: answers.age ?? null,
      is_newcomer: answers.immigration_status === 'work_permit' || answers.immigration_status === 'student',
      is_indigenous: false,
      is_woman: false,
    }

    // Step 2: Call Claude to classify the business type
    console.log(`[ProfileService.createFromIntake] Calling Claude for business classification`)
    let classification
    try {
      const systemPrompt = buildProfilePrompt(promptAnswers)
      const rawText = await askClaude(systemPrompt, 'Classify this business profile now.', 'claude-haiku-4-5-20251001', 1024)
      console.log(`[ProfileService.createFromIntake] Claude raw response: ${rawText.slice(0, 200)}`)
      classification = ProfileClassificationSchema.parse(parseClaudeJSON(rawText))
      console.log(`[ProfileService.createFromIntake] Classification: type=${classification.business_type} sector=${classification.industry_sector}`)
    } catch (err) {
      console.error(`[ProfileService.createFromIntake] Claude classification failed, falling back to "other":`, err)
      classification = {
        business_type: 'other' as const,
        industry_sector: 'general',
        business_summary: answers.business_idea,
      }
    }

    // Step 3: Build the profile DTO
    const profileDTO: CreateProfileDTO = {
      user_id,
      business_type: classification.business_type,
      business_name: null,
      business_description: classification.business_summary ?? answers.business_idea,
      industry_sector: classification.industry_sector,
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
