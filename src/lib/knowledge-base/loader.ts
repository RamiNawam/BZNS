/**
 * Knowledge Base Loader
 * src/lib/knowledge-base/loader.ts
 *
 * Loads all KB JSON files from /data/ at runtime, filters out suspended
 * programs, and exports a typed KnowledgeBase object. Uses a singleton
 * cache so files are only read from disk once per server lifecycle.
 *
 * Usage:
 *   import { loadKnowledgeBase } from '@/lib/knowledge-base/loader'
 *   const kb = await loadKnowledgeBase()
 *   const req = kb.registration.req          // fully typed
 *   const funding = kb.getAllFundingPrograms() // flat array for scorer
 */

import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------------------------
// Status type — every KB entry can carry this field
// ---------------------------------------------------------------------------

export type KBStatus = "active" | "suspended" | "verify_needed" | "historical";

// ---------------------------------------------------------------------------
// Meta block present on every file
// ---------------------------------------------------------------------------

export interface KBMeta {
  file: string;
  description: string;
  last_verified: string;
  verify_by?: string;
  verify_urls?: Record<string, string>;
  status?: KBStatus; // file-level status (e.g. suspended program)
}

// ---------------------------------------------------------------------------
// Shared eligibility shape used across permits and funding files
// ---------------------------------------------------------------------------

export interface KBEligibility {
  who_qualifies?: string[];
  who_does_not_qualify?: string[];
  automatic_disqualifiers?: string[];
  future_eligibility?: string;
  // Funding-specific scoring weights (must sum to 1.0)
  scoring_weights?: Record<string, number>;
  criteria?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Funding program — used by the deterministic scorer
// ---------------------------------------------------------------------------

export interface FundingProgram {
  _meta: KBMeta;
  id: string;
  program_name_en: string;
  program_name_fr: string;
  program_key: string;
  type:
    | "loan"
    | "grant"
    | "loan_and_grant"
    | "wage_subsidy"
    | "mentorship"
    | "free_support"
    | "support_and_mentorship"
    | "support_and_referral"
    | "financing_and_mentorship"
    | "mentorship_and_financing"
    | "multiple";
  plain_language_summary: string;
  status?: KBStatus;
  amount: {
    minimum?: number;
    maximum?: number;
    value?: number;
    note?: string;
    [key: string]: unknown;
  };
  eligibility: KBEligibility;
  application_url?: string;
  source_url: string;
  [key: string]: unknown; // allow extra fields per program
}

// ---------------------------------------------------------------------------
// Generic KB document (registration, permits, tax, compliance)
// ---------------------------------------------------------------------------

export interface KBDocument {
  _meta: KBMeta;
  id: string;
  title_en?: string;
  title_fr?: string;
  plain_language_summary: string;
  status?: KBStatus;
  eligibility?: KBEligibility;
  prerequisites?: Array<{ step: string; ref?: string; note?: string }>;
  common_mistakes?: string[];
  source_url: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// The full structured knowledge base
// ---------------------------------------------------------------------------

export interface KnowledgeBase {
  // Root-level files
  businessStructures: KBDocument;
  financialConstants: KBDocument;

  // Registration
  registration: {
    req: KBDocument;
    revenuQuebec: KBDocument;
    cra: KBDocument;
  };

  // Permits
  permits: {
    mapaq: KBDocument;
    famille: KBDocument;
    municipalMontreal: KBDocument;
    professionalOrders: KBDocument;
    racj: KBDocument;
  };

  // Tax
  tax: {
    gstQst: KBDocument;
    qpp: KBDocument;
    deductions: KBDocument;
    installments: KBDocument;
  };

  // Funding — keyed by program_key for fast lookup
  funding: Record<string, FundingProgram>;

  // Compliance
  compliance: {
    bill96: KBDocument;
    signage: KBDocument;
  };

  // ---------------------------------------------------------------------------
  // Helper: flat array of all active funding programs (for scorer)
  // ---------------------------------------------------------------------------
  getAllFundingPrograms(): FundingProgram[];

  // ---------------------------------------------------------------------------
  // Helper: get any document by its file path key (for selector injection)
  // ---------------------------------------------------------------------------
  getByKey(key: KBFileKey): KBDocument | FundingProgram | null;
}

// ---------------------------------------------------------------------------
// All valid file keys — matches the filenames in /data/
// ---------------------------------------------------------------------------

export type KBFileKey =
  | "business_structures.json"
  | "financial_constants.json"
  | "registration/req.json"
  | "registration/revenu_quebec.json"
  | "registration/cra.json"
  | "permits/mapaq.json"
  | "permits/famille.json"
  | "permits/municipal_montreal.json"
  | "permits/professional_orders.json"
  | "permits/racj.json"
  | "tax/gst_qst.json"
  | "tax/qpp.json"
  | "tax/deductions.json"
  | "tax/installments.json"
  | "funding/futurpreneur.json"
  | "funding/pme_mtl.json"
  | "funding/bdc.json"
  | "funding/sta.json"
  | "funding/fli.json"
  | "funding/investissement_quebec.json"
  | "funding/irap.json"
  | "funding/canada_summer_jobs.json"
  | "funding/demographic_programs.json"
  | "compliance/bill96.json"
  | "compliance/signage.json";

// ---------------------------------------------------------------------------
// Internal: all funding file names (relative to /data/)
// ---------------------------------------------------------------------------

const FUNDING_FILES: KBFileKey[] = [
  "funding/futurpreneur.json",
  "funding/pme_mtl.json",
  "funding/bdc.json",
  "funding/sta.json",
  "funding/fli.json",
  "funding/investissement_quebec.json",
  "funding/irap.json",
  "funding/canada_summer_jobs.json",
  "funding/demographic_programs.json",
];

// ---------------------------------------------------------------------------
// Resolve the /data/ directory regardless of where Next.js runs from
// ---------------------------------------------------------------------------

function dataDir(): string {
  // Next.js runs from the project root in both dev and production
  return path.join(process.cwd(), "data");
}

// ---------------------------------------------------------------------------
// Read and parse a single JSON file
// ---------------------------------------------------------------------------

async function readJSON<T = unknown>(relativePath: string): Promise<T> {
  const fullPath = path.join(dataDir(), relativePath);
  const raw = await fs.readFile(fullPath, "utf-8");
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// Singleton cache — files are read from disk only once
// ---------------------------------------------------------------------------

let _cache: KnowledgeBase | null = null;

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

export async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  if (_cache) return _cache;

  // Load all files in parallel
  const [
    businessStructures,
    financialConstants,
    req,
    revenuQuebec,
    cra,
    mapaq,
    famille,
    municipalMontreal,
    professionalOrders,
    racj,
    gstQst,
    qpp,
    deductions,
    installments,
    bill96,
    signage,
    ...fundingRaw
  ] = await Promise.all([
    readJSON<KBDocument>("business_structures.json"),
    readJSON<KBDocument>("financial_constants.json"),
    readJSON<KBDocument>("registration/req.json"),
    readJSON<KBDocument>("registration/revenu_quebec.json"),
    readJSON<KBDocument>("registration/cra.json"),
    readJSON<KBDocument>("permits/mapaq.json"),
    readJSON<KBDocument>("permits/famille.json"),
    readJSON<KBDocument>("permits/municipal_montreal.json"),
    readJSON<KBDocument>("permits/professional_orders.json"),
    readJSON<KBDocument>("permits/racj.json"),
    readJSON<KBDocument>("tax/gst_qst.json"),
    readJSON<KBDocument>("tax/qpp.json"),
    readJSON<KBDocument>("tax/deductions.json"),
    readJSON<KBDocument>("tax/installments.json"),
    readJSON<KBDocument>("compliance/bill96.json"),
    readJSON<KBDocument>("compliance/signage.json"),
    // Funding files loaded last, matching FUNDING_FILES order
    ...FUNDING_FILES.map((f) => readJSON<FundingProgram>(f)),
  ]);

  // Build the funding map, keyed by program_key
  // demographic_programs.json is special — it contains multiple programs
  // under a `programs` array rather than being a single program itself
  const fundingMap: Record<string, FundingProgram> = {};

  FUNDING_FILES.forEach((filePath, i) => {
    const raw = fundingRaw[i] as FundingProgram & {
      programs?: FundingProgram[];
    };

    if (raw.programs && Array.isArray(raw.programs)) {
      // Multi-program file (demographic_programs.json, pme_mtl.json)
      // Register each sub-program individually AND keep the parent file
      raw.programs.forEach((prog: FundingProgram) => {
        fundingMap[prog.id] = {
          ...prog,
          // Inherit file-level status if sub-program doesn't have its own
          status: prog.status ?? raw.status,
          _meta: raw._meta,
        };
      });
      // Also register the parent under its own key (for getByKey)
      fundingMap[raw.id ?? filePath] = raw;
    } else {
      fundingMap[raw.program_key ?? raw.id] = raw;
    }
  });

  // Build the flat document lookup map for getByKey()
  const docMap: Record<string, KBDocument | FundingProgram> = {
    "business_structures.json": businessStructures,
    "financial_constants.json": financialConstants,
    "registration/req.json": req,
    "registration/revenu_quebec.json": revenuQuebec,
    "registration/cra.json": cra,
    "permits/mapaq.json": mapaq,
    "permits/famille.json": famille,
    "permits/municipal_montreal.json": municipalMontreal,
    "permits/professional_orders.json": professionalOrders,
    "permits/racj.json": racj,
    "tax/gst_qst.json": gstQst,
    "tax/qpp.json": qpp,
    "tax/deductions.json": deductions,
    "tax/installments.json": installments,
    "compliance/bill96.json": bill96,
    "compliance/signage.json": signage,
    // Funding files registered by their path
    ...Object.fromEntries(
      FUNDING_FILES.map((f, i) => [f, fundingRaw[i] as FundingProgram]),
    ),
  };

  _cache = {
    businessStructures,
    financialConstants,
    registration: { req, revenuQuebec, cra },
    permits: { mapaq, famille, municipalMontreal, professionalOrders, racj },
    tax: { gstQst, qpp, deductions, installments },
    funding: fundingMap,
    compliance: { bill96, signage },

    // Return only active funding programs — suspended ones never reach Claude
    getAllFundingPrograms(): FundingProgram[] {
      return Object.values(fundingMap).filter(
        (p) =>
          p.status !== "suspended" &&
          p.status !== "historical" &&
          // Also skip parent multi-program containers (they have no scoring_weights)
          p.eligibility?.scoring_weights !== undefined,
      );
    },

    getByKey(key: KBFileKey): KBDocument | FundingProgram | null {
      return docMap[key] ?? null;
    },
  };

  return _cache;
}

// ---------------------------------------------------------------------------
// Dev utility: bust the cache (useful during hot reload in development)
// ---------------------------------------------------------------------------

export function bustKBCache(): void {
  _cache = null;
}

// ---------------------------------------------------------------------------
// Utility: serialize ALL KB documents for Layer 2 adversarial review.
// Returns every non-funding document with full detail — the gap detector
// needs complete eligibility criteria, common mistakes, and enforcement info
// to catch edge cases the pattern matcher missed.
// ---------------------------------------------------------------------------

const ALL_NON_FUNDING_KEYS: KBFileKey[] = [
  "business_structures.json",
  "financial_constants.json",
  "registration/req.json",
  "registration/revenu_quebec.json",
  "registration/cra.json",
  "permits/mapaq.json",
  "permits/famille.json",
  "permits/municipal_montreal.json",
  "permits/professional_orders.json",
  "permits/racj.json",
  "tax/gst_qst.json",
  "tax/qpp.json",
  "tax/deductions.json",
  "tax/installments.json",
  "compliance/bill96.json",
  "compliance/signage.json",
];

export function serializeFullKB(kb: KnowledgeBase): string {
  const docs: Array<KBDocument | FundingProgram> = [];
  for (const key of ALL_NON_FUNDING_KEYS) {
    const doc = kb.getByKey(key);
    if (doc) docs.push(doc);
  }
  // Full detail: strip only _meta (file-level metadata), keep everything else
  // including eligibility, common_mistakes, enforcement, etc.
  const cleaned = docs.map(({ _meta, ...rest }) => rest);
  return JSON.stringify(cleaned, null, 2);
}

// ---------------------------------------------------------------------------
// Utility: serialize selected KB documents to a JSON string for prompt injection
// Strips the _meta block to save tokens — Claude doesn't need file metadata
// ---------------------------------------------------------------------------

export function serializeForPrompt(
  docs: Array<KBDocument | FundingProgram>,
): string {
  const cleaned = docs.map(({ _meta, ...rest }) => rest);
  return JSON.stringify(cleaned, null, 2);
}

// ---------------------------------------------------------------------------
// Utility: slim serializer for the roadmap prompt — extracts only the fields
// Claude needs to generate step keys, titles, costs, timelines, and URLs.
// Strips verbose arrays (steps, common_mistakes, what_you_need, etc.) that
// balloon the prompt to 90K+ chars. Reduces input tokens by ~80%.
// ---------------------------------------------------------------------------

export function serializeForRoadmapPrompt(
  docs: Array<KBDocument | FundingProgram>,
): string {
  const slimmed = docs.map((doc) => {
    const d = doc as Record<string, unknown>;
    const slim: Record<string, unknown> = {
      id: d.id,
      title: d.title_en ?? d.id,
      summary: d.plain_language_summary,
      source_url: d.source_url,
    };

    if (d.is_mandatory != null) slim.is_mandatory = d.is_mandatory;

    // Cost — keep only the fee amount or a short cost note
    if (d.cost != null) {
      const cost = d.cost as Record<string, unknown>;
      slim.cost = {
        ...(cost.registration_fee != null && { registration_fee: cost.registration_fee }),
        ...(cost.permit_fee != null && { permit_fee: cost.permit_fee }),
        ...(cost.fee != null && { fee: cost.fee }),
        ...(cost.notes != null && { notes: cost.notes }),
        ...(cost.note != null && { note: cost.note }),
      };
    }

    // Timeline — keep top-level only
    if (d.timeline != null) slim.timeline = d.timeline;

    // Prerequisites — only the step refs matter
    if (Array.isArray(d.prerequisites) && d.prerequisites.length > 0) {
      slim.prerequisites = (d.prerequisites as Array<{ step: string; ref?: string }>).map(
        (p) => p.step,
      );
    }

    // Permit types (mapaq, racj, etc.) — keep id, name, eligibility summary, cost, timeline
    if (Array.isArray(d.permit_types)) {
      slim.permit_types = (d.permit_types as Record<string, unknown>[]).map((pt) => ({
        id: pt.id,
        name: pt.name_en,
        plain_language: pt.plain_language,
        cost: pt.cost,
        timeline: pt.timeline,
      }));
    }

    return slim;
  });

  return JSON.stringify(slimmed);
}
