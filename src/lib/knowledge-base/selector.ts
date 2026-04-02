/**
 * Knowledge Base Selector
 * src/lib/knowledge-base/selector.ts
 *
 * Given a user's business type, returns only the relevant KB documents
 * to inject into Claude's prompt. Keeps prompts lean — a bakery doesn't
 * need IRAP (R&D funding) or RACJ (liquor permits).
 *
 * Funding files are handled separately — they are always fully loaded
 * by the scorer (deterministic, no Claude involved). The selector only
 * controls what goes into Claude prompts.
 *
 * Usage:
 *   import { selectForPrompt } from '@/lib/knowledge-base/selector'
 *   const docs = selectForPrompt(kb, 'food')
 *   const kbString = serializeForPrompt(docs)
 */

import {
  type KnowledgeBase,
  type KBDocument,
  type FundingProgram,
  type KBFileKey,
} from "./loader";

// ---------------------------------------------------------------------------
// Business types — must match what Claude returns from the profile prompt
// ---------------------------------------------------------------------------

export type BusinessType =
  | "food"
  | "freelance"
  | "daycare"
  | "retail"
  | "personal_care"
  | "other";

// ---------------------------------------------------------------------------
// The KB map from the project plan (Section 8), extended with new files.
// Keys are the file paths in /data/ — must match KBFileKey exactly.
// Funding files are NOT listed here — they go to the scorer, not Claude.
// ---------------------------------------------------------------------------

const KB_MAP: Record<BusinessType, KBFileKey[]> = {
  food: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "permits/mapaq.json",
    "permits/municipal_montreal.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/deductions.json",
    "tax/installments.json",
    "compliance/bill96.json",
    "compliance/signage.json",
  ],

  freelance: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/deductions.json",
    "tax/installments.json",
    "compliance/bill96.json",
    // professional_orders included conditionally below
  ],

  daycare: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "permits/famille.json",
    "permits/municipal_montreal.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/installments.json",
    "compliance/bill96.json",
  ],

  retail: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "permits/municipal_montreal.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/deductions.json",
    "tax/installments.json",
    "compliance/bill96.json",
    "compliance/signage.json",
  ],

  personal_care: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "permits/municipal_montreal.json",
    "permits/professional_orders.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/deductions.json",
    "tax/installments.json",
    "compliance/bill96.json",
  ],

  other: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/deductions.json",
    "tax/installments.json",
    "compliance/bill96.json",
  ],
};

// ---------------------------------------------------------------------------
// Optional context flags — add extra files based on profile details
// ---------------------------------------------------------------------------

export interface SelectionContext {
  businessType: BusinessType;
  // Add these when known from the user's profile
  isHomeBased?: boolean; // adds municipal_montreal if not already present
  servesAlcohol?: boolean; // adds racj.json
  isRegulatedProfession?: boolean; // adds professional_orders.json
  hasCRAQuestion?: boolean; // adds cra.json
}

// ---------------------------------------------------------------------------
// Core selector — returns the right KB documents for a given business type
// ---------------------------------------------------------------------------

export function selectForPrompt(
  kb: KnowledgeBase,
  context: SelectionContext | BusinessType,
): Array<KBDocument | FundingProgram> {
  // Accept either a plain BusinessType string or a full context object
  const ctx: SelectionContext =
    typeof context === "string" ? { businessType: context } : context;

  const { businessType } = ctx;

  // Start with the base file list for this business type
  const fileKeys = new Set<KBFileKey>(KB_MAP[businessType] ?? KB_MAP.other);

  // Add optional files based on context flags
  if (ctx.isHomeBased && !fileKeys.has("permits/municipal_montreal.json")) {
    fileKeys.add("permits/municipal_montreal.json");
  }
  if (ctx.servesAlcohol) {
    fileKeys.add("permits/racj.json");
  }
  if (ctx.isRegulatedProfession) {
    fileKeys.add("permits/professional_orders.json");
  }
  if (ctx.hasCRAQuestion) {
    fileKeys.add("registration/cra.json");
  }

  // Resolve each key to its KB document, skip nulls
  const docs: Array<KBDocument | FundingProgram> = [];
  for (const key of fileKeys) {
    const doc = kb.getByKey(key);
    if (doc) docs.push(doc);
  }

  return docs;
}

// ---------------------------------------------------------------------------
// Funding selector — returns ALL active funding programs for the scorer.
// The scorer itself handles filtering by profile — we load everything here.
// ---------------------------------------------------------------------------

export function selectFundingForScorer(kb: KnowledgeBase): FundingProgram[] {
  return kb.getAllFundingPrograms();
}

// ---------------------------------------------------------------------------
// Assistant selector — broader context, includes more files.
// The assistant chat has more tokens to work with and answers open questions.
// ---------------------------------------------------------------------------

export function selectForAssistant(
  kb: KnowledgeBase,
  context: SelectionContext,
): Array<KBDocument | FundingProgram> {
  // Start with the standard prompt selection
  const base = selectForPrompt(kb, context);
  const keys = new Set(base.map((d) => (d as KBDocument).id));

  // Always add these for the assistant — users ask about anything
  const extras: KBFileKey[] = [
    "registration/cra.json",
    "tax/installments.json",
    "compliance/signage.json",
  ];

  for (const key of extras) {
    const doc = kb.getByKey(key);
    if (doc && !keys.has((doc as KBDocument).id)) {
      base.push(doc);
    }
  }

  return base;
}

// ---------------------------------------------------------------------------
// Utility: infer SelectionContext from a user profile
// Call this in the API routes instead of building context manually
// ---------------------------------------------------------------------------

export interface UserProfile {
  industry_sector?: string;
  business_type: BusinessType;
  is_home_based?: boolean;
  // Extend with other profile fields as needed
}

export function contextFromProfile(profile: UserProfile): SelectionContext {
  return {
    businessType: profile.business_type,
    isHomeBased: profile.is_home_based ?? false,
    // Heuristics — extend as you learn more about your users
    isRegulatedProfession:
      profile.business_type === "personal_care" ||
      [
        "lawyer",
        "engineer",
        "accountant",
        "architect",
        "psychologist",
        "nurse",
        "physiotherapist",
        "pharmacist",
      ].some((p) => profile.industry_sector?.toLowerCase().includes(p)),
    servesAlcohol: [
      "bar",
      "restaurant",
      "catering",
      "brewery",
      "winery",
      "distillery",
    ].some((p) => profile.industry_sector?.toLowerCase().includes(p)),
  };
}
