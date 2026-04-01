import { z } from 'zod';

/**
 * Zod schemas for validating Claude API responses.
 */

export const RoadmapStepSchema = z.object({
  id: z.string(),
  title_en: z.string(),
  title_fr: z.string(),
  description_en: z.string(),
  description_fr: z.string(),
  category: z.enum(['registration', 'permits', 'tax', 'banking', 'insurance', 'other']),
  priority: z.number().int().min(1).max(100),
  estimated_time_hours: z.number().nonnegative().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
});

export const RoadmapResponseSchema = z.array(RoadmapStepSchema);

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

export type RoadmapStep = z.infer<typeof RoadmapStepSchema>;
export type FundingMatch = z.infer<typeof FundingMatchSchema>;
export type FinancialSnapshot = z.infer<typeof FinancialSnapshotSchema>;
