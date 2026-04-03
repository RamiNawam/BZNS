/**
 * Knowledge Base Selector
 * src/lib/knowledge-base/selector.ts
 *
 * PRIMARY path: selectByClusterId(kb, clusterId)
 *   - reads CLUSTERS[clusterId].kb_files, resolves each to a KB document.
 *   - used by roadmap + assistant services after cluster assignment.
 *
 * LEGACY path: selectForPrompt(kb, context)
 *   - kept for backwards compatibility; uses the old KB_MAP.
 *
 * Given a user's business type, returns only the relevant KB documents
 * to inject into Claude's prompt. Keeps prompts lean -- a bakery doesn't
 * need IRAP (R&D funding) or RACJ (liquor permits).
 *
 * Funding files are handled separately -- they are always fully loaded
 * by the scorer (deterministic, no Claude involved). The selector only
 * controls what goes into Claude prompts.
 *
 * Usage:
 *   import { selectByClusterId } from '@/lib/knowledge-base/selector'
 *   const docs = selectByClusterId(kb, 'C1')
 */

import {
  type KnowledgeBase,
  type KBDocument,
  type FundingProgram,
  type KBFileKey,
} from "./loader";
import { CLUSTERS, type ClusterID } from "@/lib/clusters";

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
// KB_MAP: non-funding documents for each business type.
// - registration/cra.json is included in ALL types — federal tax obligations
//   apply to every self-employed person regardless of business type.
// - permits/racj.json is NOT hardcoded here — it is added conditionally via
//   SelectionContext.servesAlcohol, which is inferred from the business
//   description in contextFromProfile (not just the serves_alcohol profile flag).
// - Funding files are excluded entirely — they go to the scorer, not Claude.
// ---------------------------------------------------------------------------

const KB_MAP: Record<BusinessType, KBFileKey[]> = {
  food: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "registration/cra.json",
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
    "registration/cra.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/deductions.json",
    "tax/installments.json",
    "compliance/bill96.json",
  ],

  daycare: [
    "business_structures.json",
    "financial_constants.json",
    "registration/req.json",
    "registration/revenu_quebec.json",
    "registration/cra.json",
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
    "registration/cra.json",
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
    "registration/cra.json",
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
    "registration/cra.json",
    "tax/gst_qst.json",
    "tax/qpp.json",
    "tax/deductions.json",
    "tax/installments.json",
    "compliance/bill96.json",
  ],
};

// ---------------------------------------------------------------------------
// Products and industry terms that imply alcohol content or serving.
// Used by contextFromProfile to set servesAlcohol correctly even when
// the user does not explicitly mention alcohol in their business description.
// This list covers both businesses that SELL alcohol and food products that
// CONTAIN alcohol as an ingredient — both trigger RACJ consideration.
// ---------------------------------------------------------------------------

const ALCOHOL_INDICATORS = [
  // Businesses primarily selling alcohol
  "bar",
  "tavern",
  "brewery",
  "winery",
  "distillery",
  "pub",
  "brasserie",
  "microbrasserie",
  // Catering and restaurants that commonly serve alcohol
  "restaurant",
  "catering",
  "traiteur",
  // Food products that traditionally contain alcohol as an ingredient
  "tiramisu",
  "rum cake",
  "gâteau au rhum",
  "trifle",
  "beer batter",
  "wine sauce",
  "brandy",
  "liqueur",
  "baileys",
  "kahlua",
  "marsala",
  "champagne",
  "prosecco",
  "sangria",
  "kombucha", // may contain trace alcohol depending on fermentation
];

// ---------------------------------------------------------------------------
// Optional context flags — add extra files based on profile details
// ---------------------------------------------------------------------------

export interface SelectionContext {
  businessType: BusinessType;
  isHomeBased?: boolean; // adds municipal_montreal if not already present
  servesAlcohol?: boolean; // adds racj.json
  isRegulatedProfession?: boolean; // adds professional_orders.json
}

// ---------------------------------------------------------------------------
// Core selector — returns the right KB documents for a given business type
// ---------------------------------------------------------------------------

export function selectForPrompt(
  kb: KnowledgeBase,
  context: SelectionContext | BusinessType,
): Array<KBDocument | FundingProgram> {
  const ctx: SelectionContext =
    typeof context === "string" ? { businessType: context } : context;

  const { businessType } = ctx;

  const fileKeys = new Set<KBFileKey>(KB_MAP[businessType] ?? KB_MAP.other);

  // Add municipal rules for any home-based business not already covered
  if (ctx.isHomeBased && !fileKeys.has("permits/municipal_montreal.json")) {
    fileKeys.add("permits/municipal_montreal.json");
  }

  // Add RACJ for any business that sells or uses alcohol as an ingredient
  if (ctx.servesAlcohol) {
    fileKeys.add("permits/racj.json");
  }

  // Add professional orders for regulated professions not already covered
  if (ctx.isRegulatedProfession) {
    fileKeys.add("permits/professional_orders.json");
  }

  const docs: Array<KBDocument | FundingProgram> = [];
  for (const key of fileKeys) {
    const doc = kb.getByKey(key);
    if (doc) docs.push(doc);
  }

  return docs;
}

// ---------------------------------------------------------------------------
// PRIMARY: cluster-based selector — replaces KB_MAP logic for all new code.
// ---------------------------------------------------------------------------

export function selectByClusterId(
  kb: KnowledgeBase,
  clusterId: ClusterID,
): Array<KBDocument | FundingProgram> {
  const files = CLUSTERS[clusterId].kb_files;
  const docs: Array<KBDocument | FundingProgram> = [];
  for (const key of files) {
    const doc = kb.getByKey(key as KBFileKey);
    if (doc) docs.push(doc);
  }
  return docs;
}

// Cluster-aware assistant selector: cluster files + always-useful extras.
export function selectForClusterAssistant(
  kb: KnowledgeBase,
  clusterId: ClusterID,
): Array<KBDocument | FundingProgram> {
  const base = selectByClusterId(kb, clusterId);
  const seen = new Set(base.map((d) => (d as KBDocument).id));

  const extras: KBFileKey[] = [
    "registration/cra.json",
    "tax/installments.json",
    "compliance/signage.json",
    "permits/racj.json",
  ];

  for (const key of extras) {
    const doc = kb.getByKey(key);
    if (doc && !seen.has((doc as KBDocument).id)) {
      base.push(doc);
    }
  }
  return base;
}

// ---------------------------------------------------------------------------
// Funding selector — ALL active funding programs for the scorer.
// ---------------------------------------------------------------------------

export function selectFundingForScorer(kb: KnowledgeBase): FundingProgram[] {
  return kb.getAllFundingPrograms();
}

// ---------------------------------------------------------------------------
// Assistant selector — broader context for open-ended chat.
// ---------------------------------------------------------------------------

export function selectForAssistant(
  kb: KnowledgeBase,
  context: SelectionContext,
): Array<KBDocument | FundingProgram> {
  const base = selectForPrompt(kb, context);
  const keys = new Set(base.map((d) => (d as KBDocument).id));

  const extras: KBFileKey[] = [
    "registration/cra.json",
    "tax/installments.json",
    "compliance/signage.json",
    "permits/racj.json",
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
// Utility: infer SelectionContext from a user profile.
// This is the single source of truth for context flag inference.
// Always call this instead of building SelectionContext manually.
// ---------------------------------------------------------------------------

export interface UserProfile {
  business_type: BusinessType;
  industry_sector?: string;
  business_summary?: string;
  is_home_based?: boolean;
  serves_alcohol?: boolean;
  is_regulated_profession?: boolean;
}

export function contextFromProfile(profile: UserProfile): SelectionContext {
  // Combine industry_sector and business_summary for alcohol detection.
  // This catches cases where the user describes an alcohol-containing product
  // (e.g. "tiramisu") without explicitly saying "I serve alcohol".
  const searchText = [
    profile.industry_sector ?? "",
    profile.business_summary ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const inferredAlcohol =
    // Explicit flag from profile classification
    profile.serves_alcohol === true ||
    // Implicit: product or industry description contains alcohol indicators
    ALCOHOL_INDICATORS.some((term) => searchText.includes(term));

  const inferredRegulatedProfession =
    profile.is_regulated_profession === true ||
    profile.business_type === "personal_care" ||
    [
      "lawyer",
      "notaire",
      "engineer",
      "ingénieur",
      "accountant",
      "comptable",
      "architect",
      "architecte",
      "psychologist",
      "psychologue",
      "nurse",
      "infirmière",
      "physiotherapist",
      "physiothérapeute",
      "pharmacist",
      "pharmacien",
      "optometrist",
      "optométriste",
      "dentist",
      "dentiste",
      "veterinarian",
      "vétérinaire",
    ].some((p) => searchText.includes(p));

  return {
    businessType: profile.business_type,
    isHomeBased: profile.is_home_based ?? false,
    servesAlcohol: inferredAlcohol,
    isRegulatedProfession: inferredRegulatedProfession,
  };
}
