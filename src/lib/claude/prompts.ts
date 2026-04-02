import type { Profile } from '@/types/profile';
import type { ClusterID } from '@/lib/clusters';

/**
 * System prompt templates for the various Claude calls in BZNS.
 */

// ---------------------------------------------------------------------------
// Profile synthesis — called once after the user completes the intake wizard.
// Claude reads the raw answers and returns structured JSON including cluster.
// ---------------------------------------------------------------------------

export const PROFILE_SYNTHESIS_PROMPT = `You are a Quebec business advisor AI. A user has just completed a business intake survey.
Your job is to read their answers and return a structured JSON object with the following fields:
- business_name: a short suggested name for their business (or null if not inferable)
- business_description: one sentence describing what they do
- industry_sector: the specific industry (e.g. "home baking", "web development", "childcare")
- business_type: one of: food | freelance | daycare | retail | personal_care | other
- cluster_id: exactly one cluster from the list below

You must also classify the business into exactly one cluster and return it as cluster_id.

Clusters:
- C1: Home-based food — baking, meal prep, catering from a home kitchen
- C2: Freelance / consulting — solo service work, tech/creative/professional, no physical premises
- C3: Regulated childcare — home daycare, garderie, after-school, childcare
- C4: Regulated professional — requires a Quebec professional order (lawyer, CPA, engineer, nurse, architect, notary)
- C5: Retail / product sales — physical goods, boutique, e-commerce, crafts, market stall
- C6: Food service / hospitality — commercial restaurant, café, bar, food truck (not home-based)
- C7: Construction / trades — RBQ contractor, electrician, plumber, renovation
- C8: Personal services — hair salon, massage, esthetics, coaching, personal trainer, tattoo
- C9: General / unknown — only if no other cluster fits

Rules:
- Return exactly one cluster_id string.
- Prefer C1 over C6 for home-based food.
- Prefer C4 if a professional order is mentioned.
- Never return C9 if C1–C8 is a reasonable match.

Return ONLY valid JSON. No markdown, no explanation, no preamble.`;

export function buildProfilePrompt(answers: Record<string, unknown>): string {
  return `${PROFILE_SYNTHESIS_PROMPT}

Intake answers:
${JSON.stringify(answers, null, 2)}`;
}

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
  profileContext?: Partial<Profile> | null;
  knowledgeBase?: string;
}): string {
  const { profileContext, knowledgeBase } = options;
  let prompt = BASE_CONTEXT;

  if (profileContext) {
    // Inject cluster context so the assistant stays focused on this business type
    if (profileContext.cluster_id) {
      prompt += `\n\nBusiness cluster: ${profileContext.cluster_id} — ${profileContext.cluster_label} (complexity: ${profileContext.cluster_complexity})\nOnly generate steps and advice applicable to this cluster. Do not mention permits or obligations that do not apply.`;
    }
    prompt += `\n\n--- USER PROFILE ---\n${JSON.stringify(profileContext, null, 2)}`;
  }

  if (knowledgeBase) {
    prompt += `\n\n--- KNOWLEDGE BASE CONTEXT ---\n${knowledgeBase}`;
  }

  return prompt;
}

export function buildRoadmapPrompt(profile: Partial<Profile>): string {
  const clusterLine = profile.cluster_id
    ? `Business cluster: ${profile.cluster_id} — ${profile.cluster_label} (complexity: ${profile.cluster_complexity})\nOnly generate steps and advice applicable to this cluster. Do not mention permits or obligations that do not apply.\n\n`
    : '';

  return `${clusterLine}Based on the following business profile, generate a detailed, prioritised list of registration and launch steps.
Return the steps as a JSON array with fields: id, title_en, title_fr, description_en, description_fr, category, priority, estimated_time_hours, links.

Business Profile:
${JSON.stringify(profile, null, 2)}`;
}

export function buildFundingPrompt(profile: Partial<Profile>, programs: object[]): string {
  return `You are a funding advisor. Evaluate the following funding programs against this business profile.
Return a JSON array with: program_id, score (0–100), rationale_en, rationale_fr, recommended (boolean).

Business Profile:
${JSON.stringify(profile, null, 2)}

Available Programs:
${JSON.stringify(programs, null, 2)}`;
}

// Unused import guard — ClusterID is referenced in buildRoadmapPrompt via profile type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ClusterIDCheck = ClusterID;
