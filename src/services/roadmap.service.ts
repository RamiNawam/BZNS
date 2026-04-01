// ============================================================
// ROADMAP SERVICE — business logic for legal roadmap generation
// Orchestrates: fetch profile → select KB → call Claude → validate → save
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { RoadmapRepository } from '@/repositories/roadmap.repository'
import { CacheRepository } from '@/repositories/cache.repository'
import type { RoadmapStep, CreateRoadmapStepDTO, UpdateStepStatusDTO } from '@/types/roadmap'

// TODO: import { ClaudeClient } from '@/lib/claude/client'
// TODO: import { RoadmapSchema } from '@/lib/claude/schemas'
// TODO: import { KnowledgeBaseSelector } from '@/lib/knowledge-base/selector'

export const RoadmapService = {

  /**
   * Generate a full personalized roadmap for a user.
   * 1. Fetch profile
   * 2. Check cache (avoid redundant Claude calls)
   * 3. Select relevant KB files based on business_type
   * 4. Call Claude with profile + KB → get ordered steps
   * 5. Validate with Zod
   * 6. Save to DB + cache
   */
  async generate(profile_id: string): Promise<RoadmapStep[]> {
    const cacheKey = `roadmap:${profile_id}`

    // Check cache first
    const cached = await CacheRepository.get<RoadmapStep[]>(cacheKey)
    if (cached) return cached

    // Fetch the user's profile
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`RoadmapService.generate: Profile not found ${profile_id}`)

    // TODO: Select relevant KB files based on business_type
    // const kbFiles = KnowledgeBaseSelector.select(profile.business_type)
    // const knowledgeBase = KnowledgeBaseLoader.load(kbFiles)

    // TODO: Call Claude to generate roadmap steps
    // const rawSteps = await ClaudeClient.generateRoadmap(profile, knowledgeBase)
    // const { steps: claudeSteps } = RoadmapSchema.parse(rawSteps)

    // TODO: Map Claude output → DB DTOs
    // const stepDTOs: CreateRoadmapStepDTO[] = claudeSteps.map(step => ({
    //   ...step,
    //   profile_id,
    //   status: 'pending',
    //   completed_at: null,
    //   notes: null,
    // }))

    // STUB: return empty until Claude is wired
    const stepDTOs: CreateRoadmapStepDTO[] = []

    // Save to DB
    const savedSteps = stepDTOs.length > 0
      ? await RoadmapRepository.batchUpsert(stepDTOs)
      : []

    // Cache the result
    await CacheRepository.set(cacheKey, savedSteps)

    return savedSteps
  },

  /**
   * Fetch existing roadmap steps for a profile (no regeneration).
   */
  async getByProfileId(profile_id: string): Promise<RoadmapStep[]> {
    return RoadmapRepository.getByProfileId(profile_id)
  },

  /**
   * Update a step's status (user marks it done, in-progress, or skipped).
   * Enforces dependency check: can't complete a step if depends_on steps are pending.
   */
  async updateStepStatus(
    step_id: string,
    profile_id: string,
    update: UpdateStepStatusDTO
  ): Promise<RoadmapStep> {
    if (update.status === 'completed') {
      // Get all steps to check dependencies
      const allSteps = await RoadmapRepository.getByProfileId(profile_id)
      const targetStep = allSteps.find(s => s.id === step_id)

      if (targetStep?.depends_on && targetStep.depends_on.length > 0) {
        const pendingDeps = allSteps.filter(
          s => targetStep.depends_on!.includes(s.step_key) && s.status !== 'completed'
        )
        if (pendingDeps.length > 0) {
          throw new Error(
            `Cannot complete step: the following steps must be done first: ${pendingDeps.map(s => s.title).join(', ')}`
          )
        }
      }

      update.completed_at = new Date().toISOString()
    }

    return RoadmapRepository.updateStatus(step_id, update)
  },

  /**
   * Regenerate the roadmap from scratch (clears old steps first).
   */
  async regenerate(profile_id: string): Promise<RoadmapStep[]> {
    await RoadmapRepository.deleteByProfileId(profile_id)
    await CacheRepository.delete(`roadmap:${profile_id}`)
    return RoadmapService.generate(profile_id)
  },
}
