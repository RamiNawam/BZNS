import { loadDataFile, loadDirectory } from './loader';

export type KnowledgeSection =
  | 'registration'
  | 'permits'
  | 'tax'
  | 'funding'
  | 'compliance'
  | 'financial';

/**
 * Keyword map — maps topic keywords to knowledge base sections.
 * Used to select only the relevant context for a given user message.
 */
const KEYWORD_MAP: Record<string, KnowledgeSection[]> = {
  register: ['registration'],
  registration: ['registration'],
  req: ['registration'],
  neq: ['registration'],
  cra: ['registration'],
  'business number': ['registration'],
  'revenu québec': ['registration', 'tax'],
  permit: ['permits'],
  mapaq: ['permits'],
  restaurant: ['permits'],
  food: ['permits'],
  alcohol: ['permits'],
  racj: ['permits'],
  daycare: ['permits'],
  tax: ['tax', 'financial'],
  gst: ['tax'],
  qst: ['tax'],
  qpp: ['tax', 'financial'],
  qpip: ['tax', 'financial'],
  instalment: ['tax'],
  deduction: ['tax'],
  grant: ['funding'],
  loan: ['funding'],
  funding: ['funding'],
  futurpreneur: ['funding'],
  'pme mtl': ['funding'],
  bdc: ['funding'],
  irap: ['funding'],
  'canada summer jobs': ['funding'],
  bill96: ['compliance'],
  'bill 96': ['compliance'],
  french: ['compliance'],
  signage: ['compliance'],
  sign: ['compliance'],
  income: ['financial', 'tax'],
  'take-home': ['financial'],
  revenue: ['financial', 'tax'],
  salary: ['financial', 'tax'],
};

/**
 * Select relevant knowledge base sections based on user message content.
 * Returns a string of serialised JSON context for inclusion in the Claude prompt.
 */
export function selectKnowledgeBase(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const sections = new Set<KnowledgeSection>();

  for (const [keyword, sects] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      sects.forEach((s) => sections.add(s));
    }
  }

  // Default: include registration and financial if nothing matched
  if (sections.size === 0) {
    sections.add('registration');
    sections.add('financial');
  }

  const context: Record<string, unknown> = {};

  for (const section of sections) {
    try {
      switch (section) {
        case 'registration':
          context.registration = loadDirectory('registration');
          context.businessStructures = loadDataFile('business_structures.json');
          break;
        case 'permits':
          context.permits = loadDirectory('permits');
          break;
        case 'tax':
          context.tax = loadDirectory('tax');
          break;
        case 'funding':
          context.funding = loadDirectory('funding');
          break;
        case 'compliance':
          context.compliance = loadDirectory('compliance');
          break;
        case 'financial':
          context.financialConstants = loadDataFile('financial_constants.json');
          break;
      }
    } catch (err) {
      console.error(`Failed to load knowledge base section: ${section}`, err);
    }
  }

  return JSON.stringify(context, null, 2);
}
