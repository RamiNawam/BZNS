import { z } from 'zod';

// ---------------------------------------------------------------------------
// ClaudeRoadmapStep schema — must match ClaudeRoadmapStep in types/roadmap.ts
// ---------------------------------------------------------------------------

export const ClaudeRoadmapStepSchema = z.object({
  step_order: z.number().int().min(1),
  step_key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  why_needed: z.string(),
  estimated_cost: z.string(),
  estimated_timeline: z.string(),
  required_documents: z.array(z.string()),
  government_url: z.string(),
  source: z.string(),
  depends_on: z.array(z.string()),
});

export const ClaudeRoadmapResponseSchema = z.array(ClaudeRoadmapStepSchema);

export type ClaudeRoadmapStepParsed = z.infer<typeof ClaudeRoadmapStepSchema>;

// ---------------------------------------------------------------------------
// Profile classification schema — output of buildProfilePrompt
// ---------------------------------------------------------------------------

export const ProfileClassificationSchema = z.object({
  business_type: z.enum(['food', 'freelance', 'daycare', 'retail', 'personal_care', 'other']),
  industry_sector: z.string(),
  is_home_based: z.boolean(),
  serves_alcohol: z.boolean(),
  is_regulated_profession: z.boolean(),
  stage: z.enum(['idea', 'starting', 'operating']),
  expected_revenue_cad: z.number().nullable(),
  employee_count: z.number().nullable(),
  location: z.string(),
  age: z.number().nullable(),
  is_newcomer: z.boolean(),
  is_indigenous: z.boolean(),
  is_woman: z.boolean(),
  business_summary: z.string(),
});

export type ProfileClassification = z.infer<typeof ProfileClassificationSchema>;

// ---------------------------------------------------------------------------
// Funding / financial schemas (unchanged)
// ---------------------------------------------------------------------------

export const FundingMatchSchema = z.object({
  program_id: z.string(),
  score: z.number().min(0).max(100),
  rationale_en: z.string(),
  rationale_fr: z.string(),
  recommended: z.boolean(),
});

export const FundingResponseSchema = z.array(FundingMatchSchema);

export const FinancialSnapshotSchema = z.object({
  grossRevenue: z.number(),
  expenses: z.number(),
  netIncome: z.number(),
  federalTax: z.number(),
  provincialTax: z.number(),
  qpp: z.number(),
  qpip: z.number(),
  estimatedTakeHome: z.number(),
  effectiveTaxRate: z.number(),
  watchOutFlags: z.array(z.string()).optional(),
});

export type FundingMatch = z.infer<typeof FundingMatchSchema>;
export type FinancialSnapshot = z.infer<typeof FinancialSnapshotSchema>;

// ---------------------------------------------------------------------------
// Gap detection schema — Layer 2 adversarial review output
// ---------------------------------------------------------------------------

export const SuggestedStepSchema = z.object({
  step_key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  why_needed: z.string(),
  estimated_cost: z.string(),
  estimated_timeline: z.string(),
  depends_on: z.array(z.string()),
  government_url: z.string(),
  source: z.string(),
});

export const GapFlagSchema = z.object({
  type: z.enum(['missing_step', 'wrong_step', 'edge_case', 'verify_with_professional']),
  severity: z.enum(['high', 'medium', 'low']),
  related_step_key: z.string().nullable(),
  issue: z.string().min(1),
  recommendation: z.string().min(1),
  suggested_step: SuggestedStepSchema.optional(),
});

export const GapDetectionResponseSchema = z.array(GapFlagSchema);

export type GapFlagParsed = z.infer<typeof GapFlagSchema>;

// ---------------------------------------------------------------------------
// parseClaudeJSON — strips markdown fences Claude wraps around JSON output,
// then JSON.parses. Claude often returns: ```json\n[...]\n```
// ---------------------------------------------------------------------------

export function parseClaudeJSON(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Recover from truncated JSON array (stop_reason=max_tokens cuts mid-object).
    // Find the last fully closed object in the array and close the array there.
    const lastCompleteObject = cleaned.lastIndexOf('\n  }');
    if (lastCompleteObject !== -1) {
      const recovered = cleaned.slice(0, lastCompleteObject + 4) + '\n]';
      return JSON.parse(recovered);
    }
    throw new Error(`JSON parse failed after recovery attempt: ${cleaned.slice(0, 200)}`);
  }
}
