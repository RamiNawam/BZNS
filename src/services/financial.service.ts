// ============================================================
// FINANCIAL SERVICE — business logic for the financial snapshot
// Orchestrates: fetch profile → deterministic tax calc → Claude insights → save
// This is the most complex service — hybrid math + AI.
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { SnapshotRepository } from '@/repositories/snapshot.repository'
import { CacheRepository } from '@/repositories/cache.repository'
import type { FinancialSnapshot, SnapshotInput, CreateSnapshotDTO } from '@/types/financial'

// TODO: import { TaxCalculator } from '@/lib/financial/tax-calculator'
// TODO: import { ClaudeClient } from '@/lib/claude/client'
// TODO: import { FinancialInsightSchema } from '@/lib/claude/schemas'

export const FinancialService = {

  /**
   * Generate or refresh the financial snapshot for a user.
   *
   * Flow:
   * 1. Fetch profile (has revenue, business_structure, business_type)
   * 2. If new financial inputs provided, update profile first
   * 3. Run deterministic tax calculator (pure math, no AI)
   * 4. Call Claude for situation-specific insights (expenses, pricing, flags)
   * 5. Validate Claude response with Zod
   * 6. Upsert snapshot to DB + cache
   * 7. Return full snapshot
   */
  async generate(input: SnapshotInput): Promise<FinancialSnapshot> {
    const { profile_id, monthly_expenses, expense_categories, price_per_unit, units_per_month } = input

    // Step 1: Fetch profile
    let profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`FinancialService.generate: Profile not found ${profile_id}`)

    // Step 2: Update profile with any new financial inputs
    if (monthly_expenses !== undefined || expense_categories !== undefined) {
      profile = await ProfileRepository.update(profile_id, {
        monthly_expenses: monthly_expenses ?? profile.monthly_expenses ?? undefined,
        expense_categories: expense_categories ?? profile.expense_categories ?? undefined,
        price_per_unit: price_per_unit ?? profile.price_per_unit ?? undefined,
        units_per_month: units_per_month ?? profile.units_per_month ?? undefined,
      })
    }

    const gross_monthly_revenue = profile.expected_monthly_revenue ?? 0
    const resolved_expenses = profile.monthly_expenses ?? 0
    const business_structure = profile.business_structure ?? 'sole_proprietorship'

    // Step 3: Run deterministic tax calculator
    // TODO: Uncomment when TaxCalculator is implemented
    // const taxResult = TaxCalculator.calculate({
    //   gross_monthly_revenue,
    //   monthly_expenses: resolved_expenses,
    //   business_structure,
    // })

    // STUB tax result until calculator is implemented
    const taxResult = {
      annual_revenue: gross_monthly_revenue * 12,
      gst_collected: 0,
      qst_collected: 0,
      gst_qst_remittance: 0,
      net_revenue: (gross_monthly_revenue - resolved_expenses) * 12,
      federal_income_tax: 0,
      provincial_income_tax: 0,
      qpp_contribution: 0,
      qpip_premium: 0,
      total_deductions: 0,
      monthly_take_home: gross_monthly_revenue - resolved_expenses,
      effective_take_home_rate: gross_monthly_revenue > 0
        ? (gross_monthly_revenue - resolved_expenses) / gross_monthly_revenue
        : 0,
      quarterly_installment: 0,
    }

    // Step 4: Call Claude for insights
    // TODO: Uncomment when Claude client is wired
    // const rawInsights = await ClaudeClient.getFinancialInsights(profile, taxResult)
    // const insights = FinancialInsightSchema.parse(rawInsights)

    // STUB insights until Claude is wired
    const insights = {
      suggested_expenses: [],
      pricing_insight: '',
      watch_out_flags: [],
    }

    // Step 5: Build snapshot DTO
    const snapshotDTO: CreateSnapshotDTO = {
      profile_id,
      gross_monthly_revenue,
      monthly_expenses: resolved_expenses,
      business_structure,
      ...taxResult,
      suggested_expenses: insights.suggested_expenses,
      pricing_insight: insights.pricing_insight,
      watch_out_flags: insights.watch_out_flags,
    }

    // Step 6: Save to DB
    const saved = await SnapshotRepository.upsert(snapshotDTO)

    // Step 7: Cache it
    await CacheRepository.set(`snapshot:${profile_id}`, saved)

    return saved
  },

  /**
   * Fetch an existing snapshot without recalculating.
   */
  async getByProfileId(profile_id: string): Promise<FinancialSnapshot | null> {
    // Check cache first
    const cached = await CacheRepository.get<FinancialSnapshot>(`snapshot:${profile_id}`)
    if (cached) return cached

    return SnapshotRepository.getByProfileId(profile_id)
  },

  /**
   * Force a fresh recalculation (clears cache + DB snapshot).
   */
  async refresh(input: SnapshotInput): Promise<FinancialSnapshot> {
    await CacheRepository.delete(`snapshot:${input.profile_id}`)
    await SnapshotRepository.deleteByProfileId(input.profile_id)
    return FinancialService.generate(input)
  },
}
