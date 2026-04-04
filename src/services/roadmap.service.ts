// ============================================================
// ROADMAP SERVICE — business logic for legal roadmap generation
// Layer 1: fetch profile → select KB → call Claude → validate → save
// Layer 2: adversarial gap detection — second Claude call to find errors
// Layer 3: merge flags into steps with confidence levels
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { RoadmapRepository } from '@/repositories/roadmap.repository'
import { CacheRepository } from '@/repositories/cache.repository'
import { loadKnowledgeBase, serializeForRoadmapPrompt, serializeFullKB } from '@/lib/knowledge-base/loader'
import { selectForPrompt, contextFromProfile } from '@/lib/knowledge-base/selector'
import { buildRoadmapPrompt, buildGapDetectionPrompt } from '@/lib/knowledge-base/prompts'
import { askClaude } from '@/lib/claude/client'
import { ClaudeRoadmapResponseSchema, GapDetectionResponseSchema, parseClaudeJSON } from '@/lib/claude/schemas'
import type { RoadmapStep, CreateRoadmapStepDTO, UpdateStepStatusDTO, GapFlag, StepConfidence } from '@/types/roadmap'
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

// ---------------------------------------------------------------------------
// Layer 3: Merge flags into steps, compute confidence, insert inferred steps.
// ---------------------------------------------------------------------------

function mergeFlags(
  steps: RoadmapStep[],
  flags: GapFlag[],
  profile_id: string,
): RoadmapStep[] {
  // Build a map of step_key → flags for fast lookup
  const flagsByStep = new Map<string, GapFlag[]>()
  const missingStepFlags: GapFlag[] = []

  for (const flag of flags) {
    if (flag.type === 'missing_step' && flag.suggested_step) {
      missingStepFlags.push(flag)
    } else if (flag.related_step_key) {
      const existing = flagsByStep.get(flag.related_step_key) ?? []
      existing.push(flag)
      flagsByStep.set(flag.related_step_key, existing)
    }
  }

  // Assign confidence to existing steps
  const enriched: RoadmapStep[] = steps.map((step) => {
    const stepFlags = flagsByStep.get(step.step_key) ?? []
    const hasHighOrMedium = stepFlags.some(
      (f) => f.severity === 'high' || f.severity === 'medium'
    )

    const confidence: StepConfidence = hasHighOrMedium ? 'flagged' : 'verified'

    return {
      ...step,
      confidence,
      flags: stepFlags.length > 0 ? stepFlags : undefined,
    }
  })

  // Insert inferred steps from missing_step flags
  // Skip if a step with this step_key already exists (e.g. it was persisted on a prior click)
  const existingKeys = new Set(enriched.map((s) => s.step_key))
  const maxOrder = Math.max(...enriched.map((s) => s.step_order), 0)

  let inferredCount = 0
  for (const flag of missingStepFlags) {
    const ss = flag.suggested_step!

    if (existingKeys.has(ss.step_key)) {
      // Already persisted to DB — attach the flag to the existing step instead
      const existing = enriched.find((s) => s.step_key === ss.step_key)
      if (existing) {
        existing.confidence = 'inferred'
        existing.flags = [...(existing.flags ?? []), flag]
      }
      continue
    }

    const inferredStep: RoadmapStep = {
      // Synthetic ID — these steps aren't in the DB yet
      id: `inferred-${ss.step_key}`,
      profile_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      step_order: maxOrder + 1 + inferredCount,
      step_key: ss.step_key,
      title: ss.title,
      description: ss.description,
      why_needed: ss.why_needed,
      estimated_cost: ss.estimated_cost,
      estimated_timeline: ss.estimated_timeline,
      required_documents: [],
      government_url: ss.government_url || null,
      source: ss.source || null,
      depends_on: ss.depends_on,
      status: 'pending',
      completed_at: null,
      notes: null,
      confidence: 'inferred',
      flags: [flag],
    }

    enriched.push(inferredStep)
    inferredCount++
  }

  return enriched
}

// ---------------------------------------------------------------------------
// Exported service
// ---------------------------------------------------------------------------

export interface GenerateResult {
  steps: RoadmapStep[]
  flags: GapFlag[]
}

export const RoadmapService = {

  /**
   * Generate a full personalized roadmap for a user.
   *
   * Layer 1: fetch profile → select KB → call Claude Haiku → validate → save
   * Layer 2: call Claude Sonnet with full KB for adversarial gap detection
   * Layer 3: merge flags into steps with confidence levels
   */
  async generate(profile_id: string): Promise<GenerateResult> {
    const cacheKey = `roadmap:${profile_id}`
    const flagsCacheKey = `roadmap-flags:${profile_id}`
    console.log(`[RoadmapService.generate] START profile_id=${profile_id}`)

    // 1. Cache check — return both steps and flags
    console.log(`[RoadmapService.generate] Checking cache key=${cacheKey}`)
    const cached = await CacheRepository.get<RoadmapStep[]>(cacheKey)
    if (cached) {
      console.log(`[RoadmapService.generate] Cache HIT — returning ${cached.length} cached steps`)
      const cachedFlags = await CacheRepository.get<GapFlag[]>(flagsCacheKey) ?? []
      return { steps: cached, flags: cachedFlags }
    }
    console.log(`[RoadmapService.generate] Cache MISS — generating fresh roadmap`)

    // 2. Fetch the user's profile
    console.log(`[RoadmapService.generate] Fetching profile from DB`)
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`RoadmapService.generate: Profile not found ${profile_id}`)
    console.log(`[RoadmapService.generate] Profile found: business_type=${profile.business_type} municipality=${profile.municipality}`)

    // 3. Load KB
    console.log(`[RoadmapService.generate] Loading knowledge base`)
    const kb = await loadKnowledgeBase()

    // =====================================================================
    // LAYER 1 — JSON-based roadmap generation (Haiku, slim KB)
    // =====================================================================

    const context = contextFromProfile({
      business_type: profile.business_type,
      industry_sector: profile.industry_sector ?? undefined,
      is_home_based: profile.is_home_based,
    })
    const docs = selectForPrompt(kb, context)
    const kbJson = serializeForRoadmapPrompt(docs)
    console.log(`[RoadmapService.generate] [Layer 1] KB selected ${docs.length} documents, serialized to ${kbJson.length} chars`)

    const systemPrompt = buildRoadmapPrompt(toPromptProfile(profile), kbJson)
    console.log(`[RoadmapService.generate] [Layer 1] System prompt length: ${systemPrompt.length} chars`)
    let rawText: string

    try {
      rawText = await askClaude(systemPrompt, 'Generate the roadmap now.', 'claude-haiku-4-5-20251001', 4096, 0)
    } catch (firstError) {
      console.warn('[RoadmapService.generate] [Layer 1] First Claude call failed, retrying:', firstError)
      rawText = await askClaude(systemPrompt, 'Generate the roadmap now.', 'claude-haiku-4-5-20251001', 4096, 0)
    }
    console.log(`[RoadmapService.generate] [Layer 1] Claude raw response length: ${rawText.length} chars`)
    console.log(`[RoadmapService.generate] [Layer 1] Claude raw response preview: ${rawText.slice(0, 300)}`)

    let claudeSteps
    try {
      const parsed = parseClaudeJSON(rawText)
      console.log(`[RoadmapService.generate] [Layer 1] JSON parsed successfully, validating with Zod`)
      claudeSteps = ClaudeRoadmapResponseSchema.parse(parsed)
      console.log(`[RoadmapService.generate] [Layer 1] Zod validation passed — ${claudeSteps.length} steps`)
    } catch (err) {
      console.error(`[RoadmapService.generate] [Layer 1] Validation failed:`, err)
      console.error(`[RoadmapService.generate] [Layer 1] Full raw response:`, rawText)
      throw new Error(
        `RoadmapService.generate: Claude response failed validation. Raw: ${rawText.slice(0, 200)}`
      )
    }

    // Save Layer 1 steps to DB
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

    console.log(`[RoadmapService.generate] [Layer 1] Saving ${stepDTOs.length} steps to DB`)
    const savedSteps = await RoadmapRepository.batchUpsert(stepDTOs)
    console.log(`[RoadmapService.generate] [Layer 1] DB save OK — ${savedSteps.length} rows inserted`)

    // =====================================================================
    // LAYER 2 — Adversarial gap detection (Sonnet, full KB)
    // =====================================================================

    console.log(`[RoadmapService.generate] [Layer 2] Starting adversarial gap detection`)
    const fullKbJson = serializeFullKB(kb)
    console.log(`[RoadmapService.generate] [Layer 2] Full KB serialized to ${fullKbJson.length} chars`)

    const promptProfile = toPromptProfile(profile)
    const roadmapForReview = savedSteps.map((s) => ({
      step_key: s.step_key,
      title: s.title,
      description: s.description,
      estimated_cost: s.estimated_cost,
      depends_on: s.depends_on,
      source: s.source,
    }))

    const gapPrompt = buildGapDetectionPrompt(promptProfile, roadmapForReview, fullKbJson)
    console.log(`[RoadmapService.generate] [Layer 2] Gap detection prompt length: ${gapPrompt.length} chars`)

    let flags: GapFlag[] = []

    try {
      const gapRawText = await askClaude(
        gapPrompt,
        'Review the roadmap now. Find every gap, error, and edge case. Be adversarial.',
        'claude-haiku-4-5-20251001',
        4096,
        0,
      )
      console.log(`[RoadmapService.generate] [Layer 2] Gap detection response length: ${gapRawText.length} chars`)
      console.log(`[RoadmapService.generate] [Layer 2] Gap detection response preview: ${gapRawText.slice(0, 400)}`)

      const parsedFlags = parseClaudeJSON(gapRawText)
      flags = GapDetectionResponseSchema.parse(parsedFlags)
      console.log(`[RoadmapService.generate] [Layer 2] Validated ${flags.length} flags`)
      for (const f of flags) {
        console.log(`[RoadmapService.generate] [Layer 2]   ${f.severity.toUpperCase()} ${f.type}: ${f.issue.slice(0, 120)}`)
      }
    } catch (err) {
      // Layer 2 failure is non-fatal — we still have the Layer 1 roadmap
      console.error(`[RoadmapService.generate] [Layer 2] Gap detection failed (non-fatal):`, err)
      flags = []
    }

    // =====================================================================
    // LAYER 3 — Merge flags into steps with confidence levels
    // =====================================================================

    console.log(`[RoadmapService.generate] [Layer 3] Merging ${flags.length} flags into ${savedSteps.length} steps`)
    const enrichedSteps = mergeFlags(savedSteps, flags, profile_id)
    console.log(`[RoadmapService.generate] [Layer 3] Final roadmap: ${enrichedSteps.length} steps (${enrichedSteps.length - savedSteps.length} inferred)`)

    const verified = enrichedSteps.filter((s) => s.confidence === 'verified').length
    const flagged = enrichedSteps.filter((s) => s.confidence === 'flagged').length
    const inferred = enrichedSteps.filter((s) => s.confidence === 'inferred').length
    console.log(`[RoadmapService.generate] [Layer 3] Confidence: ${verified} verified, ${flagged} flagged, ${inferred} inferred`)

    // Cache the enriched result (steps with confidence + flags)
    await CacheRepository.set(cacheKey, enrichedSteps)
    await CacheRepository.set(flagsCacheKey, flags)
    console.log(`[RoadmapService.generate] Cache set OK`)

    return { steps: enrichedSteps, flags }
  },

  /**
   * Fetch existing roadmap steps for a profile (no regeneration).
   * Attaches cached flags if available.
   */
  async getByProfileId(profile_id: string): Promise<GenerateResult> {
    const steps = await RoadmapRepository.getByProfileId(profile_id)
    const flags = await CacheRepository.get<GapFlag[]>(`roadmap-flags:${profile_id}`) ?? []

    // Re-merge flags into steps if we have them
    if (flags.length > 0) {
      const enriched = mergeFlags(steps, flags, profile_id)
      return { steps: enriched, flags }
    }

    // No flags cached — return steps as verified
    return {
      steps: steps.map((s) => ({ ...s, confidence: 'verified' as StepConfidence })),
      flags: [],
    }
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
    // Handle inferred (non-persisted) steps — persist them to DB first
    if (step_id.startsWith('inferred-')) {
      const stepKey = step_id.replace('inferred-', '')

      // Try to find the full step data from the enriched cache
      const cacheKey = `roadmap:${profile_id}`
      const cachedSteps = await CacheRepository.get<RoadmapStep[]>(cacheKey)
      let inferredStep = cachedSteps?.find(s => s.id === step_id)

      // Fallback: reconstruct from the flags cache
      if (!inferredStep) {
        const flags = await CacheRepository.get<GapFlag[]>(`roadmap-flags:${profile_id}`) ?? []
        const flag = flags.find(f => f.type === 'missing_step' && f.suggested_step?.step_key === stepKey)
        if (flag?.suggested_step) {
          const ss = flag.suggested_step
          const existingSteps = await RoadmapRepository.getByProfileId(profile_id)
          const maxOrder = Math.max(...existingSteps.map(s => s.step_order), 0)
          inferredStep = {
            id: step_id,
            profile_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            step_order: maxOrder + 1,
            step_key: ss.step_key,
            title: ss.title,
            description: ss.description,
            why_needed: ss.why_needed,
            estimated_cost: ss.estimated_cost,
            estimated_timeline: ss.estimated_timeline,
            required_documents: [],
            government_url: ss.government_url || null,
            source: ss.source || null,
            depends_on: ss.depends_on,
            status: 'pending',
            completed_at: null,
            notes: null,
            confidence: 'inferred',
            flags: [flag],
          }
        }
      }

      if (!inferredStep) {
        throw new Error(`Cannot find inferred step: ${step_id}`)
      }

      // Persist the inferred step to the DB
      const [persisted] = await RoadmapRepository.batchUpsert([{
        profile_id,
        step_order: inferredStep.step_order,
        step_key: inferredStep.step_key,
        title: inferredStep.title,
        description: inferredStep.description,
        why_needed: inferredStep.why_needed,
        estimated_cost: inferredStep.estimated_cost,
        estimated_timeline: inferredStep.estimated_timeline,
        required_documents: inferredStep.required_documents,
        government_url: inferredStep.government_url,
        source: inferredStep.source,
        depends_on: inferredStep.depends_on,
        status: 'pending',
        completed_at: null,
        notes: null,
      }])

      // Update the enriched cache so the ID maps correctly on next load
      if (cachedSteps) {
        const updatedCache = cachedSteps.map(s =>
          s.id === step_id ? { ...s, id: persisted.id } : s
        )
        await CacheRepository.set(cacheKey, updatedCache)
      }

      // Now use the real DB id for the status update
      step_id = persisted.id
    }

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
  async regenerate(profile_id: string): Promise<GenerateResult> {
    await RoadmapRepository.deleteByProfileId(profile_id)
    await CacheRepository.delete(`roadmap:${profile_id}`)
    await CacheRepository.delete(`roadmap-flags:${profile_id}`)
    return RoadmapService.generate(profile_id)
  },

  /**
   * Clear all steps for a profile without regenerating.
   * The frontend calls POST /api/roadmap again when it wants a fresh roadmap.
   */
  async clear(profile_id: string): Promise<void> {
    await RoadmapRepository.deleteByProfileId(profile_id)
    await CacheRepository.delete(`roadmap:${profile_id}`)
    await CacheRepository.delete(`roadmap-flags:${profile_id}`)
  },
}
