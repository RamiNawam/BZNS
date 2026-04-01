import type { Profile } from '@/types/profile';
import type { FundingProgramJSON, CreateFundingMatchDTO } from '@/types/funding';

/**
 * Score a single funding program against a user profile.
 * Returns a match_score from 0 to 100 and an eligibility details map.
 *
 * This is a deterministic scorer — no Claude/AI involved.
 * Claude is only called separately to *explain* a program in plain language.
 */
export function scoreProgram(
  program: FundingProgramJSON,
  profile: Partial<Profile>,
  profile_id: string,
): CreateFundingMatchDTO {
  let score = 50; // Base score
  const eligibility: Record<string, boolean> = {};

  // ── Age eligibility ────────────────────────────────────────────────────────
  if (profile.age != null && program.eligibility.age_min != null) {
    const ageMin = program.eligibility.age_min ?? 0;
    const ageMax = program.eligibility.age_max ?? 120;
    const ageEligible = profile.age >= ageMin && profile.age <= ageMax;
    eligibility.age_eligible = ageEligible;
    score += ageEligible ? 20 : -30;
  }

  // ── Location ───────────────────────────────────────────────────────────────
  if (program.eligibility.locations && program.eligibility.locations.length > 0) {
    const userLocation = profile.municipality ?? '';
    const locationEligible = program.eligibility.locations.some((loc) =>
      userLocation.toLowerCase().includes(loc.toLowerCase())
    );
    eligibility.location_eligible = locationEligible;
    score += locationEligible ? 15 : -20;
  }

  // ── Immigration status ─────────────────────────────────────────────────────
  if (program.eligibility.immigration_status && program.eligibility.immigration_status.length > 0) {
    const userStatus = profile.immigration_status ?? '';
    const statusEligible = program.eligibility.immigration_status.includes(userStatus);
    eligibility.immigration_status_eligible = statusEligible;
    score += statusEligible ? 10 : -15;
  }

  // ── Demographics ───────────────────────────────────────────────────────────
  if (program.eligibility.demographics && program.eligibility.demographics.length > 0) {
    const userLangs = profile.languages_spoken ?? [];
    const isNewcomer = profile.immigration_status === 'work_permit' || profile.immigration_status === 'permanent_resident';
    const demographicMatch = program.eligibility.demographics.some((demo) => {
      if (demo === 'immigrant' || demo === 'newcomer') return isNewcomer;
      if (demo === 'youth') return (profile.age ?? 99) < 35;
      if (demo === 'francophone') return userLangs.includes('fr');
      return false;
    });
    eligibility.demographic_match = demographicMatch;
    score += demographicMatch ? 15 : 0;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    profile_id,
    program_key: program.key,
    program_name: program.name,
    program_type: program.type,
    amount_description: program.amount_description,
    match_score: score,
    eligibility_details: eligibility,
    summary: program.summary,
    application_url: program.application_url,
    source_url: program.source_url,
    is_bookmarked: false,
    is_dismissed: false,
  };
}

/**
 * Score all funding programs and return sorted by match_score descending.
 */
export function scorePrograms(
  programs: FundingProgramJSON[],
  profile: Partial<Profile>,
  profile_id: string,
): CreateFundingMatchDTO[] {
  return programs
    .map((program) => scoreProgram(program, profile, profile_id))
    .sort((a, b) => b.match_score - a.match_score);
}
