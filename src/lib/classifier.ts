// ============================================================
// BUSINESS CLASSIFIER — Maps intake answers to cluster (C1-C9)
// Uses the structured business_category from the intake wizard.
// No AI needed — pure deterministic mapping.
// ============================================================

import type { ClusterID } from '@/lib/clusters';

interface ClassifierInput {
  business_category?: string;
  is_home_based?: boolean;
}

/**
 * Classify a user's business into one of 9 clusters.
 * Primary signal: business_category (selected in intake step 0).
 * Secondary signal: is_home_based (differentiates C1 vs C6 for food).
 */
export function classifyBusiness(intake: ClassifierInput): ClusterID {
  const category = intake.business_category ?? '';
  const isHomeBased = intake.is_home_based ?? true;

  const CATEGORY_TO_CLUSTER: Record<string, ClusterID> = {
    food_home:       'C1',  // Home-based food
    food_commercial: 'C6',  // Food service / hospitality
    freelance:       'C2',  // Freelance / consulting
    childcare:       'C3',  // Regulated childcare
    regulated:       'C4',  // Regulated professional
    retail:          'C5',  // Retail / product sales
    trades:          'C7',  // Construction / trades
    personal:        'C8',  // Personal services
    other:           'C9',  // General / unknown
  };

  // Direct mapping from category selection
  if (category && CATEGORY_TO_CLUSTER[category]) {
    return CATEGORY_TO_CLUSTER[category];
  }

  // Fallback: if somehow no category was selected
  return 'C9';
}
