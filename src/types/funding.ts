// ============================================================
// FUNDING TYPES — mirrors the `funding_matches` table in Supabase
// ============================================================

export type ProgramType = 'loan' | 'grant' | 'tax_credit' | 'mentorship'

// Full DB row — 1:1 with funding_matches table
export interface FundingMatch {
  id: string
  profile_id: string
  created_at: string

  program_key: string         // e.g. 'futurpreneur', 'pme_mtl_young'
  program_name: string
  program_type: ProgramType
  amount_description: string | null   // e.g. 'Up to $75,000'
  match_score: number                 // 0-100 from deterministic scorer
  eligibility_details: Record<string, boolean> | null  // { age_eligible: true, ... }
  summary: string | null
  application_url: string | null
  source_url: string | null

  is_bookmarked: boolean
  is_dismissed: boolean
}

// Shape of each program JSON in /data/funding/*.json
export interface FundingProgramJSON {
  key: string
  name: string
  type: ProgramType
  amount_description: string
  summary: string
  application_url: string
  source_url: string
  eligibility: {
    age_min?: number
    age_max?: number
    locations?: string[]
    immigration_status?: string[]
    business_types?: string[]
    business_structures?: string[]
    max_employees?: number
    demographics?: string[]   // e.g. ['immigrant', 'woman', 'youth']
  }
  scoring_weights: {
    age: number
    location: number
    immigration: number
    business_type: number
    demographics: number
  }
}

// DTOs
export type CreateFundingMatchDTO = Omit<FundingMatch, 'id' | 'created_at'>
export type UpdateFundingMatchDTO = Pick<FundingMatch, 'is_bookmarked' | 'is_dismissed'>
