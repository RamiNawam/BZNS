// ============================================================
// DEDUCTION TRACKER — cluster-aware common deductions
// Shows users which expenses are tax-deductible and estimates
// the actual tax savings. Pure math, no AI.
// ============================================================

import type { ClusterID } from '@/lib/clusters';

export interface Deduction {
  key: string;
  label: string;
  annualAmount: number;        // estimated annual deductible amount
  description: string;
  source: string;              // where this rule comes from
}

export interface DeductionSummary {
  deductions: Deduction[];
  totalAnnualDeductions: number;
  estimatedTaxSavings: number;  // rough savings at ~25% marginal rate
  marginalRateUsed: number;     // the rate we used for the estimate
}

// Rough combined marginal rates for a typical micro-business owner
// in Quebec (federal ~20% effective + QC ~14% effective for low-mid income)
const ESTIMATED_MARGINAL_RATE = 0.27;

const CLUSTER_DEDUCTIONS: Record<ClusterID, Deduction[]> = {
  C1: [
    { key: 'home_kitchen',   label: 'Home kitchen (prorated)',       annualAmount: 1200, description: '% of home used for business × (rent + utilities + insurance)', source: 'CRA T2125' },
    { key: 'ingredients',    label: 'Ingredients & raw materials',   annualAmount: 3000, description: 'All ingredients purchased for products sold',               source: 'CRA T2125 — Cost of goods' },
    { key: 'packaging',      label: 'Packaging & labels',            annualAmount: 960,  description: 'Boxes, bags, stickers, labels for products',               source: 'CRA T2125 — Supplies' },
    { key: 'vehicle',        label: 'Vehicle / mileage',             annualAmount: 1728, description: 'At $0.72/km × 200km/month to markets & suppliers',          source: 'CRA motor vehicle' },
    { key: 'market_fees',    label: 'Market stall fees',             annualAmount: 720,  description: 'Farmers market rental, pop-up fees',                        source: 'CRA T2125 — Rent' },
    { key: 'permits',        label: 'MAPAQ permit fees',             annualAmount: 180,  description: 'Annual food handling permit renewal',                       source: 'CRA T2125 — Licence fees' },
  ],
  C2: [
    { key: 'home_office',    label: 'Home office (prorated)',        annualAmount: 2400, description: '~10% of rent/mortgage + utilities + internet',              source: 'CRA T2125 — Business use of home' },
    { key: 'software',       label: 'Software subscriptions',       annualAmount: 1440, description: 'IDE, design tools, cloud hosting, project management',      source: 'CRA T2125 — Office expenses' },
    { key: 'phone',          label: 'Phone & internet (business %)', annualAmount: 540,  description: 'Business portion of phone plan + internet',                 source: 'CRA T2125 — Telephone' },
    { key: 'education',      label: 'Professional development',     annualAmount: 360,  description: 'Courses, certifications, conferences',                      source: 'CRA T2125 — Training' },
    { key: 'accounting',     label: 'Accounting & legal fees',      annualAmount: 300,  description: 'Tax preparation, accounting software',                      source: 'CRA T2125 — Professional fees' },
  ],
  C3: [
    { key: 'home_daycare',   label: 'Home use for daycare',         annualAmount: 3600, description: '% of home dedicated to childcare × housing costs',          source: 'CRA T2125 — Business use of home' },
    { key: 'food_children',  label: 'Children\'s meals & snacks',   annualAmount: 2160, description: 'All food provided to enrolled children',                    source: 'CRA T2125 — Supplies' },
    { key: 'supplies',       label: 'Educational supplies & toys',  annualAmount: 960,  description: 'Art supplies, books, educational toys',                     source: 'CRA T2125 — Supplies' },
    { key: 'insurance',      label: 'Childcare liability insurance', annualAmount: 660, description: 'Annual childcare insurance premium',                        source: 'CRA T2125 — Insurance' },
    { key: 'training',       label: 'Required training & CPR',      annualAmount: 180,  description: 'CPR renewal, mandatory MFA workshops',                      source: 'CRA T2125 — Training' },
  ],
  C4: [
    { key: 'order_dues',     label: 'Professional order dues',      annualAmount: 1500, description: 'Annual dues to your professional order',                    source: 'CRA T2125 — Professional fees' },
    { key: 'insurance',      label: 'Professional liability (E&O)', annualAmount: 1800, description: 'Errors & omissions insurance',                              source: 'CRA T2125 — Insurance' },
    { key: 'office',         label: 'Office / coworking',           annualAmount: 3600, description: 'Office lease or coworking membership',                      source: 'CRA T2125 — Rent' },
    { key: 'education',      label: 'Continuing education',         annualAmount: 720,  description: 'Mandatory CE credits for your order',                       source: 'CRA T2125 — Training' },
    { key: 'software',       label: 'Professional software',        annualAmount: 960,  description: 'Industry-specific tools and subscriptions',                 source: 'CRA T2125 — Office expenses' },
  ],
  C5: [
    { key: 'cogs',           label: 'Cost of goods sold',           annualAmount: 4800, description: 'Wholesale cost of inventory purchased for resale',           source: 'CRA T2125 — Purchases' },
    { key: 'shipping',       label: 'Shipping & packaging',         annualAmount: 960,  description: 'Canada Post, courier fees, packaging materials',             source: 'CRA T2125 — Delivery/freight' },
    { key: 'platform',       label: 'Platform & processing fees',   annualAmount: 600,  description: 'Shopify, Etsy, Stripe, Square fees',                        source: 'CRA T2125 — Management fees' },
    { key: 'marketing',      label: 'Marketing & advertising',      annualAmount: 720,  description: 'Social media ads, flyers, business cards',                  source: 'CRA T2125 — Advertising' },
    { key: 'storage',        label: 'Storage / warehouse',          annualAmount: 1200, description: 'Inventory storage space rental',                             source: 'CRA T2125 — Rent' },
  ],
  C6: [
    { key: 'food_cost',      label: 'Food & beverage cost',         annualAmount: 9600,  description: '~30% of revenue for ingredients and beverages',             source: 'CRA T2125 — Purchases' },
    { key: 'rent',           label: 'Commercial rent',              annualAmount: 14400, description: 'Lease for commercial kitchen/restaurant space',              source: 'CRA T2125 — Rent' },
    { key: 'utilities',      label: 'Utilities',                    annualAmount: 2400,  description: 'Hydro-Québec, gas, water for commercial kitchen',            source: 'CRA T2125 — Utilities' },
    { key: 'equipment',      label: 'Equipment depreciation',       annualAmount: 1800,  description: 'CCA on commercial kitchen equipment',                       source: 'CRA CCA Schedule' },
    { key: 'insurance',      label: 'Restaurant insurance',         annualAmount: 1200,  description: 'Liability + property insurance',                             source: 'CRA T2125 — Insurance' },
    { key: 'permits',        label: 'Permits & licences',           annualAmount: 480,   description: 'MAPAQ, RACJ alcohol licence, municipal permits',             source: 'CRA T2125 — Licence fees' },
  ],
  C7: [
    { key: 'materials',      label: 'Materials & supplies',         annualAmount: 6000,  description: 'Lumber, electrical, plumbing supplies',                      source: 'CRA T2125 — Purchases' },
    { key: 'vehicle',        label: 'Vehicle expenses',             annualAmount: 4200,  description: 'Truck lease, fuel, maintenance for job sites',               source: 'CRA motor vehicle' },
    { key: 'tools',          label: 'Tools & equipment',            annualAmount: 1440,  description: 'Tool replacement, repair, CCA on large equipment',           source: 'CRA CCA Schedule' },
    { key: 'insurance',      label: 'Contractor insurance',         annualAmount: 2160,  description: 'General liability + RBQ requirements',                       source: 'CRA T2125 — Insurance' },
    { key: 'rbq',            label: 'RBQ licence fee',              annualAmount: 540,   description: 'Annual RBQ contractor licence',                               source: 'CRA T2125 — Licence fees' },
  ],
  C8: [
    { key: 'products',       label: 'Products & supplies',          annualAmount: 1800,  description: 'Hair products, massage oils, esthetics supplies',             source: 'CRA T2125 — Supplies' },
    { key: 'rent',           label: 'Chair / room rental',          annualAmount: 3600,  description: 'Salon chair or treatment room rental',                        source: 'CRA T2125 — Rent' },
    { key: 'insurance',      label: 'Professional liability',       annualAmount: 540,   description: 'Insurance for personal service providers',                    source: 'CRA T2125 — Insurance' },
    { key: 'tools',          label: 'Tools & equipment',            annualAmount: 480,   description: 'Scissors, machines, treatment equipment',                     source: 'CRA T2125 — Capital cost' },
    { key: 'marketing',      label: 'Marketing & booking platform', annualAmount: 360,   description: 'Social media, booking software, business cards',              source: 'CRA T2125 — Advertising' },
  ],
  C9: [
    { key: 'general',        label: 'General business expenses',    annualAmount: 1200,  description: 'Varies by business type — adjust to your situation',          source: 'CRA T2125' },
    { key: 'phone',          label: 'Phone & internet',             annualAmount: 540,   description: 'Business portion of communications',                          source: 'CRA T2125 — Telephone' },
    { key: 'software',       label: 'Software & tools',             annualAmount: 480,   description: 'Basic business software subscriptions',                       source: 'CRA T2125 — Office expenses' },
    { key: 'insurance',      label: 'Basic insurance',              annualAmount: 360,   description: 'General liability coverage',                                  source: 'CRA T2125 — Insurance' },
  ],
};

/**
 * Get the deduction summary for a cluster, with estimated tax savings.
 */
export function getDeductionSummary(clusterId: ClusterID): DeductionSummary {
  const deductions = CLUSTER_DEDUCTIONS[clusterId] ?? CLUSTER_DEDUCTIONS.C9;
  const totalAnnualDeductions = deductions.reduce((sum, d) => sum + d.annualAmount, 0);
  const estimatedTaxSavings = Math.round(totalAnnualDeductions * ESTIMATED_MARGINAL_RATE);

  return {
    deductions,
    totalAnnualDeductions,
    estimatedTaxSavings,
    marginalRateUsed: ESTIMATED_MARGINAL_RATE,
  };
}
