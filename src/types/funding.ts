export type FundingType =
  | 'grant'
  | 'loan'
  | 'loan_guarantee'
  | 'equity'
  | 'loan_and_mentorship'
  | 'wage_subsidy'
  | 'advisory'
  | 'other';

export interface FundingProgramEligibility {
  age_min?: number;
  age_max?: number;
  location?: string;
  business_stage?: string;
  business_type?: string;
  employees_max?: number;
  residency?: string;
  sectors_excluded_en?: string[];
}

export interface FundingProgram {
  id: string;
  name_en: string;
  name_fr?: string;
  website: string;
  description_en: string;
  description_fr?: string;
  type?: FundingType;
  eligibility?: FundingProgramEligibility;
  funding_details?: Record<string, unknown>;
}

export interface FundingMatch {
  programId: string;
  score: number;
  rationale_en: string;
  rationale_fr: string;
  recommended: boolean;
  program?: FundingProgram;
}
