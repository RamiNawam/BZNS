// ============================================================
// BUSINESS CLASSIFIER — Decision tree from intake answers
// We classify the business into C1-C12, NOT the user.
// No AI needed — pure deterministic logic from 4 answers.
// ============================================================

import type { ClusterID } from '@/lib/clusters';

interface ClassifierInput {
  business_activity?: string;   // food | services | professional | products | trades | children
  work_location?: string;       // home | commercial | client_sites | online
  pricing_model?: string;       // per_item | per_hour | per_session | per_project | subscription
}

/**
 * Decision tree:
 *
 * 1. activity = children     → C3 (Childcare)
 * 2. activity = trades       → C8 (Construction & trades)
 * 3. activity = professional → C4 (Regulated professional)
 * 4. activity = food
 *    - location = home       → C1 (Home-based food)
 *    - else                  → C7 (Restaurant & food service)
 * 5. activity = products
 *    - location = online     → C5 (Online retail)
 *    - else                  → C6 (Physical retail)
 * 6. activity = services
 *    - pricing = per_session + commercial → C9 (Personal care)
 *    - pricing = per_session              → C10 (Fitness & wellness)
 *    - pricing = per_project              → C11 (Creative & media)
 *    - pricing = subscription             → C12 (Education & tutoring)
 *    - else                               → C2 (Freelance)
 * 7. fallback → C2 (Freelance — lowest-friction default)
 */
export function classifyBusiness(input: ClassifierInput): ClusterID {
  const { business_activity, work_location, pricing_model } = input;

  // ── Branch: Children ──────────────────────────────────────
  if (business_activity === 'children') {
    return 'C3';
  }

  // ── Branch: Trades ────────────────────────────────────────
  if (business_activity === 'trades') {
    return 'C8';
  }

  // ── Branch: Regulated professional ────────────────────────
  if (business_activity === 'professional') {
    return 'C4';
  }

  // ── Branch: Food ──────────────────────────────────────────
  if (business_activity === 'food') {
    if (work_location === 'home') return 'C1';
    return 'C7';
  }

  // ── Branch: Products ──────────────────────────────────────
  if (business_activity === 'products') {
    if (work_location === 'online') return 'C5';
    return 'C6';
  }

  // ── Branch: Services (most nuanced) ───────────────────────
  if (business_activity === 'services') {
    if (pricing_model === 'per_session') {
      if (work_location === 'commercial' || work_location === 'client_sites') return 'C9';
      return 'C10';
    }

    if (pricing_model === 'per_project') return 'C11';
    if (pricing_model === 'subscription') return 'C12';
    return 'C2'; // per_hour, per_item, or unset → freelance
  }

  // ── Fallback ──────────────────────────────────────────────
  return 'C2';
}
