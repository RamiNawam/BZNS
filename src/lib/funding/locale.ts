// ============================================================
// FUNDING LOCALE — client-side translation of funding data
// Program names, amount descriptions, and document lists
// come from the server in English. This module provides
// French translations so the UI can pick the right string.
// ============================================================

// ── Program names (FR) — sourced from data/funding/*.json ───
const PROGRAM_NAME_FR: Record<string, string> = {
  bdc: 'BDC — Banque de développement du Canada',
  futurpreneur: 'Futurpreneur Canada — Financement de d\u00e9marrage',
  pme_mtl: 'PME MTL — Programmes d\u2019entrepreneuriat montr\u00e9alais',
  irap: 'PARI-CNRC — Programme d\u2019aide \u00e0 la recherche industrielle',
  fli: 'Fonds locaux d\u2019investissement (FLI)',
  investissement_quebec: 'Investissement Qu\u00e9bec — Plan PME',
  canada_summer_jobs: 'Emplois d\u2019\u00e9t\u00e9 Canada',
  demographic_programs: 'Programmes pour entrepreneurs sous-repr\u00e9sent\u00e9s',
}

// ── Amount description patterns ─────────────────────────────
function translateAmount(desc: string | null, locale: string): string | null {
  if (!desc || locale !== 'fr') return desc

  // "Varies — see program details"
  if (/^varies/i.test(desc)) {
    return 'Variable — voir les d\u00e9tails du programme'
  }

  // "Up to $75,000"
  const upTo = desc.match(/^Up to \$?([\d,]+)$/i)
  if (upTo) {
    const num = upTo[1]
    return `Jusqu\u2019\u00e0 ${num}\u00a0$`
  }

  // "Funding available"
  if (/^funding available$/i.test(desc)) {
    return 'Financement disponible'
  }

  // Dollar amounts like "$95K+" stay as-is (universal format)
  return desc
}

// ── Document translations ───────────────────────────────────
// Only the FALLBACK_DOCUMENTS from funding.service.ts need FR.
// KB-sourced documents are in English — we translate the common ones.
const DOC_FR: Record<string, string> = {
  // IRAP
  'Contact an NRC Industrial Technology Advisor (ITA) first — no application before ITA approval':
    'Contactez d\u2019abord un conseiller en technologie industrielle (CTI) du CNRC — pas de demande sans approbation du CTI',
  'R&D project proposal: technical objectives, timeline, budget, expected outcomes':
    'Proposition de projet R-D : objectifs techniques, \u00e9ch\u00e9ancier, budget, r\u00e9sultats attendus',
  'Proof of Canadian incorporation':
    'Preuve de constitution en soci\u00e9t\u00e9 canadienne',
  'Employee payroll records (funding covers eligible salary costs)':
    'Registres de paie des employ\u00e9s (le financement couvre les co\u00fbts salariaux admissibles)',

  // Canada Summer Jobs
  'GCOS portal account (Grants and Contributions Online Services at canada.ca)':
    'Compte sur le portail SELSC (Services en ligne des subventions et contributions sur canada.ca)',
  'Business Number (BN) from CRA':
    'Num\u00e9ro d\u2019entreprise (NE) de l\u2019ARC',
  'Job position description and duties for the summer role':
    'Description du poste et des t\u00e2ches pour l\u2019emploi d\u2019\u00e9t\u00e9',
  'Proof of eligible employer status (non-profit, public body, or private business with under 50 employees)':
    'Preuve du statut d\u2019employeur admissible (OBNL, organisme public ou entreprise priv\u00e9e de moins de 50 employ\u00e9s)',

  // Investissement Quebec
  'Business plan': 'Plan d\u2019affaires',
  '2-3 year financial projections': 'Projections financi\u00e8res sur 2-3 ans',
  'Personal and business financial statements': '\u00c9tats financiers personnels et d\u2019entreprise',
  'NEQ registration': 'Immatriculation au NEQ',
  'Bank statements (last 6 months)': 'Relev\u00e9s bancaires (6 derniers mois)',
  'Proof of Quebec residency': 'Preuve de r\u00e9sidence au Qu\u00e9bec',

  // Demographic programs
  'Business plan or project description': 'Plan d\u2019affaires ou description du projet',
  'Proof of immigration status or newcomer documents': 'Preuve du statut d\u2019immigration ou documents de nouvel arrivant',
  'Government-issued photo ID': 'Pi\u00e8ce d\u2019identit\u00e9 avec photo \u00e9mise par le gouvernement',
  'Financial projections': 'Projections financi\u00e8res',
  'Contact YES Montr\u00e9al or PACO directly — required documents vary by program':
    'Contactez YES Montr\u00e9al ou PACO directement — les documents requis varient selon le programme',

  // Common across programs (from KB JSONs)
  'Recent business plan or detailed project description':
    'Plan d\u2019affaires r\u00e9cent ou description d\u00e9taill\u00e9e du projet',
  'Cash flow projections for 12-24 months':
    'Projections de tr\u00e9sorerie sur 12-24 mois',
  'Proof of Quebec residency or business registration':
    'Preuve de r\u00e9sidence au Qu\u00e9bec ou immatriculation d\u2019entreprise',
  'Government-issued photo ID (2 pieces)':
    'Pi\u00e8ce d\u2019identit\u00e9 avec photo (2 pi\u00e8ces)',
  'Personal net worth statement':
    '\u00c9tat de la valeur nette personnelle',
  'Resume / CV showing relevant experience':
    'CV montrant l\u2019exp\u00e9rience pertinente',
  'BDC online application form':
    'Formulaire de demande en ligne BDC',
  'Business plan (use Futurpreneur template — available on their website)':
    'Plan d\u2019affaires (utilisez le mod\u00e8le Futurpreneur — disponible sur leur site)',
  'Cash flow projections for 24 months':
    'Projections de tr\u00e9sorerie sur 24 mois',
  'Mentor match application (Futurpreneur pairs every entrepreneur with a mentor)':
    'Demande de jumelage avec un mentor (Futurpreneur jumelle chaque entrepreneur avec un mentor)',
  'Proof of Canadian residency':
    'Preuve de r\u00e9sidence canadienne',
  'Personal credit check consent':
    'Consentement \u00e0 la v\u00e9rification du cr\u00e9dit personnel',
  'Business plan or pitch deck':
    'Plan d\u2019affaires ou pr\u00e9sentation',
  'Financial projections (revenue, expenses, break-even)':
    'Projections financi\u00e8res (revenus, d\u00e9penses, seuil de rentabilit\u00e9)',
  'Proof of Montr\u00e9al business location':
    'Preuve de l\u2019emplacement de l\u2019entreprise \u00e0 Montr\u00e9al',
  'NEQ number (Registre des entreprises)':
    'Num\u00e9ro NEQ (Registre des entreprises)',
  'Letter describing the project and how funding will be used':
    'Lettre d\u00e9crivant le projet et l\u2019utilisation du financement',
  'Apply through your local PME MTL office (6 offices across Montr\u00e9al)':
    'Faites votre demande aupr\u00e8s de votre bureau PME MTL local (6 bureaux \u00e0 Montr\u00e9al)',
  'Project proposal aligned with borough economic development priorities':
    'Proposition de projet align\u00e9e sur les priorit\u00e9s de d\u00e9veloppement \u00e9conomique de l\u2019arrondissement',
  'Business registration (NEQ)':
    'Immatriculation d\u2019entreprise (NEQ)',
  'Proof of Montr\u00e9al location':
    'Preuve de l\u2019emplacement \u00e0 Montr\u00e9al',
}

// ── Public helpers ──────────────────────────────────────────

/** Translate a program name to French (falls back to original EN name) */
export function localizeProgramName(programKey: string, programName: string, locale: string): string {
  if (locale !== 'fr') return programName
  return PROGRAM_NAME_FR[programKey] ?? programName
}

/** Translate an amount description like "Up to $75,000" or "Varies" */
export function localizeAmount(desc: string | null, locale: string): string | null {
  return translateAmount(desc, locale)
}

/** Translate a single document requirement string */
export function localizeDocument(doc: string, locale: string): string {
  if (locale !== 'fr') return doc
  return DOC_FR[doc] ?? doc
}

/** Translate a summary string — for now just passes through (summaries are from Claude/KB) */
export function localizeSummary(summary: string | null, locale: string): string | null {
  if (!summary || locale !== 'fr') return summary
  // Summaries are rich text from the KB — no simple pattern translation.
  // They stay in English until the KB provides FR summaries.
  return summary
}
