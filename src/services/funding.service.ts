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
import type { FundingMatch, FundingProgramJSON, CreateFundingMatchDTO, UpdateFundingMatchDTO, ProgramType } from '@/types/funding'

// ── Max numeric amounts per program (for total_potential_funding) ─────────────
const PROGRAM_MAX_AMOUNTS: Record<string, number> = {
  bdc:                    100_000,
  futurpreneur:            75_000,
  pme_mtl:                 20_000,
  sta:                     31_200,
  irap:                    50_000,
  fli:                     50_000,
  investissement_quebec:  150_000,
  canada_summer_jobs:      20_000,
  demographic_programs:    15_000,
}

const FUNDING_FILES = [
  'bdc', 'futurpreneur', 'pme_mtl', 'sta', 'irap', 'fli',
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

function extractEligibility(raw: Record<string, unknown>): FundingProgramJSON['eligibility'] {
  const elig = (raw.eligibility ?? {}) as Record<string, unknown>
  const criteria = (elig.criteria ?? {}) as Record<string, unknown>

  // Age — handle both min_age and minimum patterns
  const ageCriteria = (criteria.age ?? {}) as Record<string, unknown>
  const ageMin = (ageCriteria.min_age ?? ageCriteria.minimum) as number | undefined
  const rawMax = ageCriteria.max_age ?? ageCriteria.maximum
  const ageMax = typeof rawMax === 'number' ? rawMax : undefined

  // Immigration status
  const immCriteria = (criteria.immigration_status ?? {}) as Record<string, unknown>
  const immigrationStatus = (immCriteria.eligible ?? []) as string[]

  // Location — flag Montreal-specific programs
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

  return {
    ...(ageMin !== undefined && { age_min: ageMin }),
    ...(ageMax !== undefined && { age_max: ageMax }),
    ...(locations.length > 0 && { locations }),
    ...(immigrationStatus.length > 0 && { immigration_status: immigrationStatus }),
    ...(demographics.length > 0 && { demographics }),
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
    source_url: extractUrl(raw),
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

  async scoreForProfile(profile_id: string): Promise<{
    matches: FundingMatch[]
    total_potential_funding: string
  }> {
    const cacheKey = `funding:${profile_id}`
    const cached = await CacheRepository.get<{ matches: FundingMatch[]; total_potential_funding: string }>(cacheKey)
    if (cached) return cached

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

  async explainProgram(profile_id: string, program_key: string): Promise<string> {
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`FundingService.explainProgram: Profile not found`)

    const programs = loadFundingPrograms()
    const program = programs.find((p) => p.key === program_key)

    const systemPrompt = buildSystemPrompt({ profileContext: profile })
    const explanation = await askClaude(
      systemPrompt,
      `Explain the "${program?.name ?? program_key}" funding program to this person in 2-3 plain sentences. Focus on why it's relevant to them and what they need to do next. Be direct and practical. User profile: ${JSON.stringify({ business_type: profile.business_type, city: profile.municipality, age: profile.age, immigration_status: profile.immigration_status })}`,
      'claude-sonnet-4-6'
    )
    return explanation
  },

  async updateMatch(match_id: string, update: UpdateFundingMatchDTO): Promise<FundingMatch> {
    return FundingRepository.update(match_id, update)
  },
}
