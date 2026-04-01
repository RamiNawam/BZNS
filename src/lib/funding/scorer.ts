import type { UserProfile } from '@/types/profile';
import type { FundingProgram, FundingMatch } from '@/types/funding';

/**
 * Score a funding program against a user profile.
 * Returns a score from 0 to 100 and a brief rationale.
 */
export function scoreProgram(
  program: FundingProgram,
  profile: Partial<UserProfile>
): FundingMatch {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Age eligibility (e.g., Futurpreneur 18–39)
  if (profile.age && program.eligibility?.age_min !== undefined) {
    if (
      profile.age >= (program.eligibility.age_min ?? 0) &&
      profile.age <= (program.eligibility.age_max ?? 120)
    ) {
      score += 20;
      reasons.push('Age within eligible range');
    } else {
      score -= 30;
      reasons.push('Age outside eligible range');
    }
  }

  // Location (Montreal programs)
  if (program.eligibility?.location?.toLowerCase().includes('montreal')) {
    if (profile.city?.toLowerCase().includes('montreal')) {
      score += 15;
      reasons.push('Located in Montreal');
    } else {
      score -= 20;
      reasons.push('Program requires Montreal location');
    }
  }

  // Business stage
  if (
    program.eligibility?.business_stage?.toLowerCase().includes('startup') &&
    profile.businessStage === 'pre_launch'
  ) {
    score += 15;
    reasons.push('Startup stage matches program focus');
  }

  // Cap score
  score = Math.max(0, Math.min(100, score));

  return {
    programId: program.id,
    score,
    rationale_en: reasons.join('. ') || 'General eligibility assessment',
    rationale_fr: reasons.join('. ') || 'Évaluation générale de l\'admissibilité',
    recommended: score >= 60,
  };
}

/**
 * Score all funding programs and return sorted results.
 */
export function scorePrograms(
  programs: FundingProgram[],
  profile: Partial<UserProfile>
): FundingMatch[] {
  return programs
    .map((program) => scoreProgram(program, profile))
    .sort((a, b) => b.score - a.score);
}
