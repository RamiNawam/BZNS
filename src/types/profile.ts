// ============================================================
// PROFILE TYPES — mirrors the `profiles` table in Supabase
// snake_case matches Supabase's default column naming
// ============================================================

export type ClusterID = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10' | 'C11' | 'C12'
export type ClusterComplexity = 'low' | 'medium' | 'high'

export type BusinessType =
  | 'food'
  | 'freelance'
  | 'daycare'
  | 'retail'
  | 'personal_care'
  | 'other'

export type BusinessStructure =
  | 'sole_proprietorship'
  | 'corporation'
  | 'partnership'

export type ImmigrationStatus =
  | 'citizen'
  | 'permanent_resident'
  | 'work_permit'
  | 'student'

// Full DB row — 1:1 with the profiles table
export interface Profile {
  id: string
  user_id: string
  created_at: string
  updated_at: string

  // Business info (from intake)
  business_name: string | null
  business_type: BusinessType
  business_description: string | null
  industry_sector: string | null
  municipality: string
  borough: string | null
  is_home_based: boolean
  has_physical_location: boolean

  // Personal info (from intake)
  full_name: string | null
  age: number | null
  immigration_status: ImmigrationStatus | null
  gender: string | null
  languages_spoken: string[] | null
  preferred_language: string

  // Business setup (from intake)
  business_structure: BusinessStructure | null
  has_partners: boolean
  num_employees: number
  expected_monthly_revenue: number | null
  startup_budget: number | null
  has_neq: boolean
  has_gst_qst: boolean

  // Financial snapshot inputs (added on dashboard)
  monthly_expenses: number | null
  expense_categories: Record<string, number> | null
  price_per_unit: number | null
  units_per_month: number | null

  // Intake tracking
  intake_completed: boolean
  intake_answers: Record<string, unknown> | null

  // Business cluster — set by Claude after intake
  cluster_id: ClusterID | null
  cluster_label: string | null
  cluster_complexity: ClusterComplexity | null

  // Financial questionnaire (cluster-specific, persisted per account)
  financial_questionnaire_completed?: boolean
  financial_questionnaire_answers?: Record<string, string | number | boolean> | null
}

// Raw answers from the intake wizard (sent from the frontend)
export interface IntakeAnswers {
  // Classification questions (we classify, not the user)
  business_name: string
  business_activity: string         // food | services | professional | products | trades | children
  work_location: string             // home | commercial | client_sites | online
  pricing_model: string             // per_item | per_hour | per_session | per_project | subscription

  // Legal roadmap questions
  business_idea: string
  location: string
  borough?: string
  is_home_based: boolean
  date_of_birth: string
  immigration_status: ImmigrationStatus
  expected_monthly_revenue: number
  has_partners: boolean
  languages: string[]
  preferred_language: string
}

// DTOs — what the service layer accepts
export type CreateProfileDTO = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type UpdateProfileDTO = Partial<CreateProfileDTO>
