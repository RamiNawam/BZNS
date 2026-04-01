import type { UserProfile } from '@/types/profile';

/**
 * System prompt templates for the various Claude calls in BZNS.
 */

const BASE_CONTEXT = `You are BZNS Assistant, an expert guide for micro-business owners in Quebec, Canada.
You have deep knowledge of:
- Quebec and federal business registration (REQ, CRA, Revenu Québec)
- Industry permits (MAPAQ, RACJ, Ministère de la Famille, professional orders)
- Tax obligations (GST/QST, income tax, QPP, QPIP, instalments)
- Funding programs (Futurpreneur, PME MTL, BDC, IQ, IRAP, CSJ, and more)
- Language compliance (Bill 96 / Charter of the French Language)
- Montreal municipal requirements

Always be:
- Accurate and cite specific forms, deadlines, and fees where known
- Bilingual-aware (respond in the user's language, English or French)
- Practical and actionable
- Clear that your information is for guidance only and professional advice should be sought for complex situations`;

export function buildSystemPrompt(options: {
  profileContext?: Partial<UserProfile> | null;
  knowledgeBase?: string;
}): string {
  const { profileContext, knowledgeBase } = options;
  let prompt = BASE_CONTEXT;

  if (profileContext) {
    prompt += `\n\n--- USER PROFILE ---\n${JSON.stringify(profileContext, null, 2)}`;
  }

  if (knowledgeBase) {
    prompt += `\n\n--- KNOWLEDGE BASE CONTEXT ---\n${knowledgeBase}`;
  }

  return prompt;
}

export function buildRoadmapPrompt(profile: Partial<UserProfile>): string {
  return `Based on the following business profile, generate a detailed, prioritised list of registration and launch steps.
Return the steps as a JSON array with fields: id, title_en, title_fr, description_en, description_fr, category, priority, estimated_time_hours, links.

Business Profile:
${JSON.stringify(profile, null, 2)}`;
}

export function buildFundingPrompt(profile: Partial<UserProfile>, programs: object[]): string {
  return `You are a funding advisor. Evaluate the following funding programs against this business profile.
Return a JSON array with: program_id, score (0–100), rationale_en, rationale_fr, recommended (boolean).

Business Profile:
${JSON.stringify(profile, null, 2)}

Available Programs:
${JSON.stringify(programs, null, 2)}`;
}
