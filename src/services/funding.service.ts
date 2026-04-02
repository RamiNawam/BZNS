// ============================================================
// FUNDING SERVICE — wires scorer to real JSON data
// ============================================================

import fs from 'fs'
import path from 'path'
import { ProfileRepository } from '@/repositories/profile.repository'
import { FundingRepository } from '@/repositories/funding.repository'
import { CacheRepository } from '@/repositories/cache.repository'
import { scorePrograms } from '@/lib/funding/scorer'
import { askClaude } from '@/lib/claude/client'
import { buildSystemPrompt } from '@/lib/claude/prompts'
import { parseClaudeJSON } from '@/lib/claude/schemas'
import type { FundingMatch, FundingProgramJSON, FundingExplanation, CreateFundingMatchDTO, UpdateFundingMatchDTO, ProgramType } from '@/types/funding'

// ── Max numeric amounts per program (for total_potential_funding) ─────────────
const PROGRAM_MAX_AMOUNTS: Record<string, number> = {
  bdc:                    100_000,
  futurpreneur:            75_000,
  pme_mtl:                 20_000,
  irap:                    50_000,
  fli:                     50_000,
  investissement_quebec:  150_000,
  canada_summer_jobs:      20_000,
  demographic_programs:    15_000,
}

// STA (Soutien au Travail Autonome) is excluded — suspended since May 1, 2024
const FUNDING_FILES = [
  'bdc', 'futurpreneur', 'pme_mtl', 'irap', 'fli',
  'investissement_quebec', 'canada_summer_jobs', 'demographic_programs',
]

// ── JSON → FundingProgramJSON adapter ────────────────────────────────────────

function extractAmountDescription(raw: Record<string, unknown>): string {
  const amount = raw.amount as Record<string, unknown> | undefined
  if (!amount) return 'Varies — see program details'
  if (typeof amount.maximum === 'number') return `Up to $${amount.maximum.toLocaleString('en-CA')}`
  if (typeof amount.micro_loan_max === 'number') return `Up to $${amount.micro_loan_max.toLocaleString('en-CA')}`
  if (typeof amount.typical_maximum === 'number') return `Up to $${amount.typical_maximum.toLocaleString('en-CA')}`
  if (typeof amount.total === 'number') return `Up to $${amount.total.toLocaleString('en-CA')}`
  if (typeof amount.total_potential === 'string') return amount.total_potential
  return 'Varies — see program details'
}

function extractUrl(raw: Record<string, unknown>): string {
  if (typeof raw.application_url === 'string') return raw.application_url
  const meta = raw._meta as Record<string, unknown> | undefined
  const urls = meta?.verify_urls as Record<string, string> | undefined
  return urls?.apply ?? urls?.main ?? ''
}

function extractSourceUrl(raw: Record<string, unknown>): string {
  const meta = raw._meta as Record<string, unknown> | undefined
  const urls = meta?.verify_urls as Record<string, string> | undefined
  return urls?.main ?? extractUrl(raw)
}

// Normalize JSON immigration status values to match Profile.ImmigrationStatus enum
const IMMIGRATION_NORMALIZE: Record<string, string> = {
  canadian_citizen:  'citizen',
  protected_person:  'citizen',
  refugee:           'citizen',
  // permanent_resident, work_permit, student already match Profile enum
}

// Per-program business type allow-lists (empty = no restriction)
// BusinessType enum: 'food' | 'freelance' | 'daycare' | 'retail' | 'personal_care' | 'other'
const PROGRAM_BUSINESS_TYPES: Record<string, string[]> = {
  irap: ['freelance', 'other'], // only tech/innovation businesses qualify
}

function extractEligibility(raw: Record<string, unknown>): FundingProgramJSON['eligibility'] {
  const elig = (raw.eligibility ?? {}) as Record<string, unknown>
  const criteria = (elig.criteria ?? {}) as Record<string, unknown>

  // Age — handle both min_age and minimum patterns
  const ageCriteria = (criteria.age ?? {}) as Record<string, unknown>
  const ageMin = (ageCriteria.min_age ?? ageCriteria.minimum) as number | undefined
  const rawMax = ageCriteria.max_age ?? ageCriteria.maximum
  const ageMax = typeof rawMax === 'number' ? rawMax : undefined

  // Immigration status — normalize keys to match Profile.ImmigrationStatus
  const immCriteria = (criteria.immigration_status ?? {}) as Record<string, unknown>
  const rawStatuses = (immCriteria.eligible ?? []) as string[]
  const immigrationStatus = rawStatuses.map((s) => IMMIGRATION_NORMALIZE[s] ?? s)

  // Location — flag Montréal-specific programs
  const locationRequired = raw.location_required as string | undefined
  const locCriteria = (criteria.location ?? {}) as Record<string, unknown>
  const locEligible = (locCriteria.eligible ?? locCriteria.detail ?? '') as string
  const isMontreal =
    locationRequired?.toLowerCase().includes('montréal') ||
    locationRequired?.toLowerCase().includes('montreal') ||
    locEligible.toLowerCase().includes('montréal') ||
    locEligible.toLowerCase().includes('montreal') ||
    raw.program_key === 'pme_mtl' ||
    raw.program_key === 'fli'
  const locations = isMontreal ? ['montreal', 'montréal'] : []

  // Demographics
  const demographics: string[] = []
  if (raw.program_key === 'demographic_programs') {
    demographics.push('immigrant', 'newcomer', 'woman', 'youth')
  }

  // Business types (programs with sector restrictions)
  const businessTypes = PROGRAM_BUSINESS_TYPES[raw.program_key as string] ?? []

  return {
    ...(ageMin !== undefined && { age_min: ageMin }),
    ...(ageMax !== undefined && { age_max: ageMax }),
    ...(locations.length > 0 && { locations }),
    ...(immigrationStatus.length > 0 && { immigration_status: immigrationStatus }),
    ...(demographics.length > 0 && { demographics }),
    ...(businessTypes.length > 0 && { business_types: businessTypes }),
  }
}

function extractScoringWeights(raw: Record<string, unknown>): FundingProgramJSON['scoring_weights'] {
  const elig = (raw.eligibility ?? {}) as Record<string, unknown>
  const sw = (elig.scoring_weights ?? {}) as Record<string, number>

  return {
    age:           sw.age ?? 0.2,
    location:      sw.location_montreal ?? sw.location ?? 0.2,
    immigration:   sw.immigration_status ?? 0.2,
    business_type: sw.business_type ?? sw.business_type_tech ?? sw.sector ?? 0.2,
    demographics:  sw.demographics ?? sw.immigration_status_immigrant ?? 0.2,
  }
}

function adaptProgram(raw: Record<string, unknown>): FundingProgramJSON {
  const rawType = raw.type as string
  const type: ProgramType =
    rawType === 'loan' ? 'loan'
    : rawType === 'grant' ? 'grant'
    : rawType === 'tax_credit' ? 'tax_credit'
    : rawType === 'mentorship' ? 'mentorship'
    : 'loan' // multiple / unknown → default to loan

  return {
    key: raw.program_key as string,
    name: (raw.program_name_en ?? raw.title_en ?? raw.program_key) as string,
    type,
    amount_description: extractAmountDescription(raw),
    summary: (raw.plain_language_summary ?? '') as string,
    application_url: extractUrl(raw),
    source_url: extractSourceUrl(raw),
    eligibility: extractEligibility(raw),
    scoring_weights: extractScoringWeights(raw),
  }
}

function loadFundingPrograms(): FundingProgramJSON[] {
  const dataDir = path.join(process.cwd(), 'data', 'funding')
  return FUNDING_FILES.map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dataDir, `${file}.json`), 'utf-8'))
    return adaptProgram(raw)
  })
}

function computeTotalPotential(matches: CreateFundingMatchDTO[]): string {
  const total = matches
    .filter((m) => m.match_score >= 50)
    .reduce((sum, m) => sum + (PROGRAM_MAX_AMOUNTS[m.program_key] ?? 0), 0)
  if (total === 0) return 'Funding available'
  const thousands = Math.round(total / 1000)
  return `$${thousands}K+`
}

// ── Service ───────────────────────────────────────────────────────────────────

export const FundingService = {

  computeTotalFromMatches(matches: FundingMatch[]): string {
    return computeTotalPotential(matches as unknown as CreateFundingMatchDTO[])
  },

  async scoreForProfile(profile_id: string, force_refresh = false): Promise<{
    matches: FundingMatch[]
    total_potential_funding: string
  }> {
    const cacheKey = `funding:${profile_id}`
    if (!force_refresh) {
      const cached = await CacheRepository.get<{ matches: FundingMatch[]; total_potential_funding: string }>(cacheKey)
      if (cached) return cached
    }

    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`FundingService.scoreForProfile: Profile not found ${profile_id}`)

    const programs = loadFundingPrograms()
    const scored = scorePrograms(programs, profile, profile_id)
    const filtered = scored.filter((m) => m.match_score > 0)

    const savedMatches = filtered.length > 0
      ? await FundingRepository.batchUpsert(filtered)
      : []

    const total_potential_funding = computeTotalPotential(filtered)
    const result = { matches: savedMatches, total_potential_funding }
    await CacheRepository.set(cacheKey, result)
    return result
  },

  async getByProfileId(profile_id: string): Promise<FundingMatch[]> {
    return FundingRepository.getByProfileId(profile_id)
  },

  async explainProgram(
    profile_id: string,
    program_key: string,
    match_score?: number,
    eligibility_details?: Record<string, boolean> | null,
  ): Promise<FundingExplanation> {
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`FundingService.explainProgram: Profile not found`)

    const programs = loadFundingPrograms()
    const program = programs.find((p) => p.key === program_key)
    if (!program) throw new Error(`FundingService.explainProgram: Program not found: ${program_key}`)

    const programFacts = JSON.stringify({
      name: program.name,
      type: program.type,
      amount: program.amount_description,
      summary: program.summary,
      eligibility: program.eligibility,
      application_url: program.application_url,
    }, null, 2)

    const userProfile = JSON.stringify({
      age: profile.age,
      immigration_status: profile.immigration_status,
      municipality: profile.municipality,
      borough: profile.borough,
      business_description: profile.business_description,
      business_type: profile.business_type,
      languages_spoken: profile.languages_spoken,
    }, null, 2)

    const eligibilityCtx = eligibility_details
      ? JSON.stringify(eligibility_details, null, 2)
      : 'Not available'

    const scoreCtx = match_score !== undefined ? `${match_score}/100` : 'Not available'

    const systemPrompt = buildSystemPrompt({ profileContext: profile })

    // Step A — Generate structured JSON explanation grounded in supplied facts only
    const rawText = await askClaude(
      systemPrompt,
      `You are a Quebec business funding expert. Explain why this program did or didn't fully match this user.
Use ONLY the facts below — never invent amounts, rules, or eligibility criteria.

PROGRAM FACTS:
${programFacts}

USER PROFILE:
${userProfile}

ELIGIBILITY CHECK RESULTS (true = user meets criterion, false = user does not):
${eligibilityCtx}

MATCH SCORE: ${scoreCtx}

Return ONLY this exact JSON (no markdown fences, no extra text):
{
  "program_overview": "2 sentences: (1) what this program provides and its key benefit, (2) the primary reason this specific user was matched.",
  "eligible_factors": [
    { "label": "Short factor name", "detail": "Specific sentence using the user's actual data (age, city, status).", "impact": "high" }
  ],
  "missing_factors": [
    { "label": "Short factor name", "detail": "What the user lacks or what would have raised the score. Be constructive." }
  ],
  "next_step": "One direct sentence: exactly what to do right now, referencing the application URL."
}

Rules:
- eligible_factors: only what the user actually meets based on ELIGIBILITY CHECK RESULTS. Max 4.
- missing_factors: real gaps or optional improvements only. Can be []. Max 3.
- impact values must be exactly "high", "medium", or "low".
- Reference the user's real characteristics (age, city, immigration status). Never be generic.
- next_step must be one concrete actionable sentence.`,
      'claude-sonnet-4-6',
      700
    )

    // Step B — Parse + validate JSON
    let parsed: FundingExplanation
    try {
      parsed = parseClaudeJSON(rawText) as FundingExplanation
      if (!parsed.program_overview || !Array.isArray(parsed.eligible_factors) || !parsed.next_step) {
        throw new Error('Missing required fields')
      }
    } catch {
      // Fallback: minimal structure so UI never breaks
      return {
        program_overview: rawText.slice(0, 300),
        eligible_factors: [],
        missing_factors: [],
        next_step: `Visit ${program.application_url} to begin your application.`,
      }
    }

    // Step C — Self-verify: fact-check key claims against source facts
    const verifyText = await askClaude(
      'You are a fact-checker for a Quebec business funding assistant.',
      `PROGRAM FACTS (authoritative):
${programFacts}

EXPLANATION JSON TO VERIFY:
${JSON.stringify(parsed, null, 2)}

Check: does any field contain amounts, dates, or eligibility rules that contradict the program facts?
- If all accurate: return the JSON unchanged.
- If inaccurate: return corrected JSON with the same structure.
Return ONLY valid JSON. No markdown, no commentary.`,
      'claude-sonnet-4-6',
      700
    )

    try {
      const verified = parseClaudeJSON(verifyText) as FundingExplanation
      if (verified.program_overview && Array.isArray(verified.eligible_factors) && verified.next_step) {
        return verified
      }
    } catch { /* fall through to unverified */ }

    return parsed
  },

  async updateMatch(match_id: string, update: UpdateFundingMatchDTO): Promise<FundingMatch> {
    return FundingRepository.update(match_id, update)
  },
}
