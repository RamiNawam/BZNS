// ============================================================
// ROADMAP SERVICE — business logic for legal roadmap generation
// Orchestrates: fetch profile → select KB → call Claude → validate → save
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { RoadmapRepository } from '@/repositories/roadmap.repository'
import { CacheRepository } from '@/repositories/cache.repository'
import { loadKnowledgeBase, serializeForPrompt } from '@/lib/knowledge-base/loader'
import { selectForPrompt, contextFromProfile } from '@/lib/knowledge-base/selector'
import { buildRoadmapPrompt } from '@/lib/knowledge-base/prompts'
import { askClaude } from '@/lib/claude/client'
import { ClaudeRoadmapResponseSchema, parseClaudeJSON } from '@/lib/claude/schemas'
import type { RoadmapStep, CreateRoadmapStepDTO, UpdateStepStatusDTO } from '@/types/roadmap'
import type { Profile } from '@/types/profile'
import type { UserProfile } from '@/lib/knowledge-base/prompts'

// ---------------------------------------------------------------------------
// Map the DB Profile row to the UserProfile shape buildRoadmapPrompt expects.
// ---------------------------------------------------------------------------

function toPromptProfile(p: Profile): UserProfile {
  const sector = p.industry_sector?.toLowerCase() ?? ''
  return {
    business_type: p.business_type,
    industry_sector: p.industry_sector ?? p.business_type,
    is_home_based: p.is_home_based,
    serves_alcohol: ['bar', 'restaurant', 'catering', 'brewery', 'winery', 'distillery'].some(
      (k) => sector.includes(k)
    ),
    is_regulated_profession:
      p.business_type === 'personal_care' ||
      ['lawyer', 'engineer', 'accountant', 'architect', 'psychologist', 'nurse', 'physiotherapist', 'pharmacist'].some(
        (k) => sector.includes(k)
      ),
    stage: p.has_neq ? 'operating' : 'starting',
    expected_revenue_cad:
      p.expected_monthly_revenue != null ? p.expected_monthly_revenue * 12 : null,
    employee_count: p.num_employees,
    location: [p.borough, p.municipality].filter(Boolean).join(', '),
    age: p.age,
    is_newcomer:
      p.immigration_status === 'work_permit' || p.immigration_status === 'student',
    is_indigenous: false,
    is_woman: p.gender?.toLowerCase().startsWith('f') ?? false,
    business_summary:
      p.business_description ??
      `A ${p.business_type} business in ${p.municipality}`,
  }
}

export const RoadmapService = {

  /**
   * Generate a full personalized roadmap for a user.
   * 1. Check cache — return immediately on hit (demo day: Yara's roadmap is pre-cached)
   * 2. Fetch profile
   * 3. Load KB + select relevant documents for this business type
   * 4. Call Claude with profile + KB → get ordered steps
   * 5. Validate with Zod — throws if Claude returned malformed data
   * 6. Save to DB + cache
   */
  async generate(profile_id: string): Promise<RoadmapStep[]> {
    const cacheKey = `roadmap:${profile_id}`
    console.log(`[RoadmapService.generate] START profile_id=${profile_id}`)

    // 1. Cache check
    console.log(`[RoadmapService.generate] Checking cache key=${cacheKey}`)
    const cached = await CacheRepository.get<RoadmapStep[]>(cacheKey)
    if (cached) {
      console.log(`[RoadmapService.generate] Cache HIT — returning ${cached.length} cached steps`)
      return cached
    }
    console.log(`[RoadmapService.generate] Cache MISS — generating fresh roadmap`)

    // 2. Fetch the user's profile
    console.log(`[RoadmapService.generate] Fetching profile from DB`)
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`RoadmapService.generate: Profile not found ${profile_id}`)
    console.log(`[RoadmapService.generate] Profile found: business_type=${profile.business_type} municipality=${profile.municipality}`)

    // 3. Load KB and select documents relevant to this business type
    console.log(`[RoadmapService.generate] Loading knowledge base`)
    const kb = await loadKnowledgeBase()
    const context = contextFromProfile({
      business_type: profile.business_type,
      industry_sector: profile.industry_sector ?? undefined,
      is_home_based: profile.is_home_based,
    })
    const docs = selectForPrompt(kb, context)
    const kbJson = serializeForPrompt(docs)
    console.log(`[RoadmapService.generate] KB selected ${docs.length} documents, serialized to ${kbJson.length} chars`)

    // 4. Build the prompt and call Claude (up to 2 attempts)
    const systemPrompt = buildRoadmapPrompt(toPromptProfile(profile), kbJson)
    console.log(`[RoadmapService.generate] System prompt length: ${systemPrompt.length} chars`)
    let rawText: string

    try {
      rawText = await askClaude(systemPrompt, 'Generate the roadmap now.', 'claude-haiku-4-5-20251001')
    } catch (firstError) {
      console.warn('[RoadmapService.generate] First Claude call failed, retrying:', firstError)
      rawText = await askClaude(systemPrompt, 'Generate the roadmap now.', 'claude-haiku-4-5-20251001')
    }
    console.log(`[RoadmapService.generate] Claude raw response length: ${rawText.length} chars`)
    console.log(`[RoadmapService.generate] Claude raw response preview: ${rawText.slice(0, 300)}`)

    // 5. Parse + validate with Zod
    let claudeSteps
    try {
      const parsed = parseClaudeJSON(rawText)
      console.log(`[RoadmapService.generate] JSON parsed successfully, validating with Zod`)
      claudeSteps = ClaudeRoadmapResponseSchema.parse(parsed)
      console.log(`[RoadmapService.generate] Zod validation passed — ${claudeSteps.length} steps`)
    } catch (err) {
      console.error(`[RoadmapService.generate] Validation failed:`, err)
      console.error(`[RoadmapService.generate] Full raw response:`, rawText)
      throw new Error(
        `RoadmapService.generate: Claude response failed validation. Raw: ${rawText.slice(0, 200)}`
      )
    }

    // 6. Map validated Claude steps → DB insert shape
    const stepDTOs: CreateRoadmapStepDTO[] = claudeSteps.map((step) => ({
      profile_id,
      step_order: step.step_order,
      step_key: step.step_key,
      title: step.title,
      description: step.description,
      why_needed: step.why_needed,
      estimated_cost: step.estimated_cost,
      estimated_timeline: step.estimated_timeline,
      required_documents: step.required_documents,
      government_url: step.government_url,
      source: step.source,
      depends_on: step.depends_on,
      status: 'pending',
      completed_at: null,
      notes: null,
    }))

    // 7. Save to DB and cache
    console.log(`[RoadmapService.generate] Saving ${stepDTOs.length} steps to DB`)
    const savedSteps = await RoadmapRepository.batchUpsert(stepDTOs)
    console.log(`[RoadmapService.generate] DB save OK — ${savedSteps.length} rows inserted`)
    await CacheRepository.set(cacheKey, savedSteps)
    console.log(`[RoadmapService.generate] Cache set OK`)

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

  /**
   * Clear all steps for a profile without regenerating.
   * The frontend calls POST /api/roadmap again when it wants a fresh roadmap.
   */
  async clear(profile_id: string): Promise<void> {
    await RoadmapRepository.deleteByProfileId(profile_id)
    await CacheRepository.delete(`roadmap:${profile_id}`)
  },
}
