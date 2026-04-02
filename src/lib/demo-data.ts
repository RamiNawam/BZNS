import type { FundingMatch } from '@/types/funding';
import type { RoadmapStep } from '@/types/roadmap';
import type { FinancialSnapshot, WatchOutFlag } from '@/types/financial';

const now = new Date().toISOString();
const demoProfileId = 'demo-profile';

export const demoRoadmapSteps: RoadmapStep[] = [
  {
    id: 'step-1',
    profile_id: demoProfileId,
    created_at: now,
    updated_at: now,
    step_order: 1,
    step_key: 'choose_structure',
    title: 'Choose your business structure',
    description: 'Compare sole proprietorship vs corporation for taxes and liability.',
    why_needed: 'This affects your registration, tax filing, and personal risk exposure.',
    estimated_cost: 'Free',
    estimated_timeline: '1 day',
    required_documents: ['ID', 'Business idea summary'],
    government_url: 'https://www.quebec.ca/en/businesses-and-self-employed-workers',
    source: 'business_structures.json',
    depends_on: [],
    status: 'completed',
    completed_at: now,
    notes: null,
  },
  {
    id: 'step-2',
    profile_id: demoProfileId,
    created_at: now,
    updated_at: now,
    step_order: 2,
    step_key: 'register_neq',
    title: 'Register for your NEQ',
    description: 'Submit your enterprise registration to the Registraire des entreprises du Quebec.',
    why_needed: 'Most business activities require an NEQ before permits and tax setup.',
    estimated_cost: '$41',
    estimated_timeline: '2-5 business days',
    required_documents: ['Business name', 'Address', 'Owner details'],
    government_url: 'https://www.registreentreprises.gouv.qc.ca',
    source: 'registration/req.json',
    depends_on: ['choose_structure'],
    status: 'in_progress',
    completed_at: null,
    notes: null,
  },
  {
    id: 'step-3',
    profile_id: demoProfileId,
    created_at: now,
    updated_at: now,
    step_order: 3,
    step_key: 'tax_setup',
    title: 'Set up GST/QST obligations',
    description: 'Verify threshold status and register tax accounts when required.',
    why_needed: 'You must register once taxable supplies exceed threshold conditions.',
    estimated_cost: 'Free',
    estimated_timeline: '1-2 days',
    required_documents: ['NEQ', 'Revenue forecast'],
    government_url: 'https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/',
    source: 'tax/gst_qst.json',
    depends_on: ['register_neq'],
    status: 'pending',
    completed_at: null,
    notes: null,
  },
];

export const demoFundingMatches: FundingMatch[] = [
  {
    id: 'fund-1',
    profile_id: demoProfileId,
    created_at: now,
    program_key: 'futurpreneur',
    program_name: 'Futurpreneur Startup Program',
    program_type: 'loan',
    amount_description: 'Up to $75,000',
    match_score: 92,
    eligibility_details: {
      age_eligible: true,
      location_eligible: true,
      startup_stage_eligible: true,
    },
    summary: 'Startup financing and mentorship for young founders launching in Quebec.',
    application_url: 'https://www.futurpreneur.ca',
    source_url: 'https://www.futurpreneur.ca',
    is_bookmarked: false,
    is_dismissed: false,
  },
  {
    id: 'fund-2',
    profile_id: demoProfileId,
    created_at: now,
    program_key: 'pme_mtl',
    program_name: 'PME MTL Young Entrepreneur Fund',
    program_type: 'grant',
    amount_description: '$15,000 + support services',
    match_score: 84,
    eligibility_details: {
      age_eligible: true,
      montreal_eligible: true,
      business_type_eligible: true,
    },
    summary: 'Non-dilutive local support for early-stage Montreal businesses.',
    application_url: 'https://pmemtl.com',
    source_url: 'https://pmemtl.com',
    is_bookmarked: true,
    is_dismissed: false,
  },
];

export const demoWatchFlags: WatchOutFlag[] = [
  {
    type: 'info',
    title: 'Under GST/QST threshold',
    detail: 'At your current annual revenue, registration may not be mandatory yet.',
  },
  {
    type: 'warning',
    title: 'QPP self-employed contributions',
    detail: 'You pay both employee and employer shares as a self-employed founder.',
  },
  {
    type: 'tip',
    title: 'Track home-office expenses',
    detail: 'A proportional share of rent, internet, and utilities may be deductible.',
  },
];

export function buildDemoSnapshot(
  grossMonthlyRevenue: number,
  monthlyExpenses: number,
  calc: {
    annual_revenue: number;
    gst_collected: number;
    qst_collected: number;
    gst_qst_remittance: number;
    net_revenue: number;
    federal_income_tax: number;
    provincial_income_tax: number;
    qpp_contribution: number;
    qpip_premium: number;
    total_deductions: number;
    monthly_take_home: number;
    effective_take_home_rate: number;
    quarterly_installment: number;
  },
): FinancialSnapshot {
  return {
    id: 'demo-snapshot',
    profile_id: demoProfileId,
    created_at: now,
    updated_at: now,
    gross_monthly_revenue: grossMonthlyRevenue,
    monthly_expenses: monthlyExpenses,
    business_structure: 'sole_proprietorship',
    annual_revenue: calc.annual_revenue,
    gst_collected: calc.gst_collected,
    qst_collected: calc.qst_collected,
    gst_qst_remittance: calc.gst_qst_remittance,
    net_revenue: calc.net_revenue,
    federal_income_tax: calc.federal_income_tax,
    provincial_income_tax: calc.provincial_income_tax,
    qpp_contribution: calc.qpp_contribution,
    qpip_premium: calc.qpip_premium,
    total_deductions: calc.total_deductions,
    monthly_take_home: calc.monthly_take_home,
    effective_take_home_rate: calc.effective_take_home_rate,
    quarterly_installment: calc.quarterly_installment,
    suggested_expenses: [
      { category: 'Marketing and ads', estimated_monthly: 75 },
      { category: 'Software subscriptions', estimated_monthly: 45 },
      { category: 'Professional fees', estimated_monthly: 60 },
    ],
    pricing_insight:
      'For service businesses in Montreal, many founders benchmark rates monthly and adjust after their first 5-10 clients.',
    watch_out_flags: demoWatchFlags,
  };
}
