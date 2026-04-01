// ============================================================
// FINANCIAL TYPES — mirrors the `financial_snapshots` table in Supabase
// ============================================================

export interface SuggestedExpense {
  category: string            // e.g. 'Home kitchen utilities (prorated)'
  estimated_monthly: number   // e.g. 40
}

export interface WatchOutFlag {
  type: 'info' | 'warning' | 'tip'
  title: string
  detail: string
}

// Full DB row — 1:1 with financial_snapshots table
export interface FinancialSnapshot {
  id: string
  profile_id: string
  created_at: string
  updated_at: string

  // Inputs (copied from profile at snapshot time)
  gross_monthly_revenue: number
  monthly_expenses: number
  business_structure: string

  // Deterministic tax calculator outputs
  annual_revenue: number | null
  gst_collected: number | null
  qst_collected: number | null
  gst_qst_remittance: number | null     // 0 if under $30K threshold
  net_revenue: number | null
  federal_income_tax: number | null
  provincial_income_tax: number | null
  qpp_contribution: number | null       // ~12.8% for self-employed
  qpip_premium: number | null
  total_deductions: number | null
  monthly_take_home: number | null      // The key number shown on dashboard
  effective_take_home_rate: number | null  // e.g. 0.573 = 57.3%
  quarterly_installment: number | null

  // Claude-generated insights
  suggested_expenses: SuggestedExpense[] | null
  pricing_insight: string | null
  watch_out_flags: WatchOutFlag[] | null
}

// What the tax calculator returns (pure math, no DB fields)
export interface TaxCalculationResult {
  annual_revenue: number
  gst_collected: number
  qst_collected: number
  gst_qst_remittance: number
  net_revenue: number
  federal_income_tax: number
  provincial_income_tax: number
  qpp_contribution: number
  qpip_premium: number
  total_deductions: number
  monthly_take_home: number
  effective_take_home_rate: number
  quarterly_installment: number
}

// What Claude returns for the insight section (validated by Zod)
export interface FinancialInsights {
  suggested_expenses: SuggestedExpense[]
  pricing_insight: string
  watch_out_flags: WatchOutFlag[]
}

// What the API route receives
export interface SnapshotInput {
  profile_id: string
  monthly_expenses?: number
  expense_categories?: Record<string, number>
  price_per_unit?: number
  units_per_month?: number
}

// DTOs
export type CreateSnapshotDTO = Omit<FinancialSnapshot, 'id' | 'created_at' | 'updated_at'>

// Tax bracket shape (from financial_constants.json)
export interface TaxBracket {
  min: number
  max: number | null
  rate: number
}
