// ============================================================
// STEP → PROFILE SYNC
// Maps completed roadmap step_keys to profile field updates.
// When a step is marked complete, these fields are patched so
// the funding scorer immediately reflects the user's new status.
// ============================================================

import type { UpdateProfileDTO } from '@/types/profile'

export const STEP_PROFILE_SYNC: Partial<Record<string, Partial<UpdateProfileDTO>>> = {
  // NEQ registration — unlocks "launching" / "operating" stage in scorer
  req_registration:           { has_neq: true },

  // Federal / provincial tax registration
  cra_registration:           { has_gst_qst: true },
  revenu_quebec_registration: { has_gst_qst: true },
}

// Human-readable label for each profile field that a step can update.
// Shown in the funding card as: "Completing X in your Roadmap will unlock this."
export const PROFILE_FIELD_LABELS: Partial<Record<keyof UpdateProfileDTO, string>> = {
  has_neq:     'NEQ Registration',
  has_gst_qst: 'GST/QST Registration',
}
