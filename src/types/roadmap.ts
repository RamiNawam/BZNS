// ============================================================
// ROADMAP TYPES — mirrors the `roadmap_steps` table in Supabase
// ============================================================

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

// ============================================================
// GAP DETECTION — Layer 2 adversarial review output
// ============================================================

export type GapFlagType = 'missing_step' | 'wrong_step' | 'edge_case' | 'verify_with_professional'
export type GapFlagSeverity = 'high' | 'medium' | 'low'
export type StepConfidence = 'verified' | 'inferred' | 'flagged'

export interface GapFlag {
  type: GapFlagType
  severity: GapFlagSeverity
  /** step_key of the step this flag applies to, or null for missing steps */
  related_step_key: string | null
  issue: string
  recommendation: string
  /** For missing_step type: a suggested step to insert into the roadmap */
  suggested_step?: {
    step_key: string
    title: string
    description: string
    why_needed: string
    estimated_cost: string
    estimated_timeline: string
    depends_on: string[]
    government_url: string
    source: string
  }
}

// Full DB row — 1:1 with roadmap_steps table
export interface RoadmapStep {
  id: string
  profile_id: string
  created_at: string
  updated_at: string

  step_order: number
  step_key: string           // e.g. 'req_registration', 'mapaq_permit'
  title: string
  description: string
  why_needed: string | null
  estimated_cost: string | null       // e.g. '$41' or 'Free'
  estimated_timeline: string | null   // e.g. '2-3 business days'
  required_documents: string[] | null
  government_url: string | null
  source: string | null               // KB file that sourced this step
  depends_on: string[] | null         // step_keys this step depends on

  status: StepStatus
  completed_at: string | null
  notes: string | null

  // Layer 3 — enriched after gap detection
  confidence?: StepConfidence
  flags?: GapFlag[]
}

// Shape Claude returns per step (before inserting to DB)
export interface ClaudeRoadmapStep {
  step_order: number
  step_key: string
  title: string
  description: string
  why_needed: string
  estimated_cost: string
  estimated_timeline: string
  required_documents: string[]
  government_url: string
  source: string
  depends_on: string[]
}

// DTOs
export type CreateRoadmapStepDTO = Omit<RoadmapStep, 'id' | 'created_at' | 'updated_at' | 'confidence' | 'flags'>
export type UpdateStepStatusDTO = {
  status: StepStatus
  completed_at?: string
  notes?: string
}

// State shape for the roadmap Zustand store
export interface RoadmapState {
  steps: RoadmapStep[]
  flags: GapFlag[]
  isLoading: boolean
  error: string | null
}
