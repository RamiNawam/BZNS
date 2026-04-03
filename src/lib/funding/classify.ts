import type { FundingMatch } from '@/types/funding';
import type { Profile } from '@/types/profile';

const IMMUTABLE_KEYS = [
  'age_eligible',
  'location_eligible',
  'immigration_status_eligible',
  'business_type_eligible',
] as const;

/** All eligibility checks pass — user can apply today */
export function isFullyMatched(match: FundingMatch): boolean {
  const details = match.eligibility_details;
  if (!details || Object.keys(details).length === 0) {
    return match.match_score >= 90;
  }
  return Object.values(details).every(Boolean);
}

/** All immutable requirements pass but some achievable ones fail */
export function isAchievable(match: FundingMatch): boolean {
  if (isFullyMatched(match)) return false;
  const details = match.eligibility_details;
  if (!details || Object.keys(details).length === 0) {
    return match.match_score >= 50;
  }
  return IMMUTABLE_KEYS.every((k) => !(k in details) || details[k] !== false);
}

/** Parse max dollar value from a description like "Up to $75,000" or "$5,000 – $25,000" */
export function parseMaxAmount(desc: string | null): number {
  if (!desc) return 0;
  const nums = desc.match(/\d[\d,]*/g);
  if (!nums) return 0;
  return Math.max(...nums.map((n) => parseInt(n.replace(/,/g, ''), 10)));
}

/** Format a total CAD amount as "$XXK+" */
function formatTotal(totalCAD: number): string {
  if (totalCAD === 0) return '';
  if (totalCAD >= 1000) {
    return `$${Math.round(totalCAD / 1000)}K+`;
  }
  return `$${totalCAD.toLocaleString()}+`;
}

/**
 * Compute stats for programs you fully qualify for right now.
 * `total` is a dollar string like "$75K+" if amounts are quantifiable, or "" if all say "Varies".
 * `count` is the number of fully-matched programs.
 */
export function computeImmediateStats(matches: FundingMatch[]): { total: string; count: number } {
  const ready = matches.filter((m) => !m.is_dismissed && isFullyMatched(m));
  const dollarTotal = ready.reduce((sum, m) => sum + parseMaxAmount(m.amount_description), 0);
  return {
    total: dollarTotal > 0 ? formatTotal(dollarTotal) : '',
    count: ready.length,
  };
}

/** Kept for backwards compat — prefer computeImmediateStats */
export function computeImmediateTotal(matches: FundingMatch[]): string {
  return computeImmediateStats(matches).total;
}

/**
 * Stable fingerprint of funding-relevant profile fields.
 * Only these fields affect the scorer — used to detect staleness.
 */
export function fundingFingerprint(profile: Profile | null): string {
  if (!profile) return '';
  return JSON.stringify({
    business_type: profile.business_type,
    age: profile.age,
    immigration_status: profile.immigration_status,
    municipality: profile.municipality,
    has_neq: profile.has_neq,
    expected_monthly_revenue: profile.expected_monthly_revenue,
    gender: profile.gender,
    languages_spoken: profile.languages_spoken,
  });
}
