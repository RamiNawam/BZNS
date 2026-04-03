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
    { key: 'inventory',      label: 'Inventory purchases',          annualAmount: 8400,  description: 'Wholesale inventory purchased for resale',                    source: 'CRA T2125 — Purchases' },
    { key: 'rent',           label: 'Store rent',                   annualAmount: 18000, description: 'Lease for storefront, kiosk, or market location',                source: 'CRA T2125 — Rent' },
    { key: 'utilities',      label: 'Utilities',                    annualAmount: 1800,  description: 'Hydro-Québec, internet, heating/cooling',                       source: 'CRA T2125 — Utilities' },
    { key: 'pos_system',     label: 'POS fees & hardware',          annualAmount: 600,   description: 'Square/Lightspeed monthly fees and terminals',                source: 'CRA T2125 — Office expenses' },
    { key: 'insurance',      label: 'Retail insurance',             annualAmount: 960,   description: 'General liability + contents coverage',                       source: 'CRA T2125 — Insurance' },
    { key: 'marketing',      label: 'Signage & local advertising',  annualAmount: 900,   description: 'Store signage, flyers, local campaigns',                      source: 'CRA T2125 — Advertising' },
  ],
  C7: [
    { key: 'food_cost',      label: 'Food & beverage cost',         annualAmount: 28800, description: '~30% of sales for ingredients and beverages',                  source: 'CRA T2125 — Purchases' },
    { key: 'rent',           label: 'Commercial kitchen rent',      annualAmount: 14400, description: 'Lease for kitchen, counter, or dining space',                    source: 'CRA T2125 — Rent' },
    { key: 'utilities',      label: 'Utilities',                    annualAmount: 2400,  description: 'Hydro-Québec, gas, water for food operations',                  source: 'CRA T2125 — Utilities' },
    { key: 'equipment',      label: 'Kitchen equipment (CCA)',      annualAmount: 1800,  description: 'Depreciation/maintenance for cooking equipment',                 source: 'CRA CCA Schedule' },
    { key: 'insurance',      label: 'Hospitality insurance',        annualAmount: 1200,  description: 'Liability + property insurance for food service',                source: 'CRA T2125 — Insurance' },
    { key: 'permits',        label: 'MAPAQ/RACJ permit fees',       annualAmount: 480,   description: 'Food permits and alcohol permit fees (where applicable)',      source: 'CRA T2125 — Licence fees' },
  ],
  C8: [
    { key: 'materials',      label: 'Materials & supplies',         annualAmount: 6000,  description: 'Lumber, fixtures, wiring, consumables by project',              source: 'CRA T2125 — Purchases' },
    { key: 'vehicle',        label: 'Vehicle expenses',             annualAmount: 4200,  description: 'Truck/van lease, fuel, maintenance for job sites',               source: 'CRA motor vehicle' },
    { key: 'tools',          label: 'Tools & equipment',            annualAmount: 1440,  description: 'Tool replacement, repair, and equipment depreciation',            source: 'CRA CCA Schedule' },
    { key: 'insurance',      label: 'Contractor insurance',         annualAmount: 2160,  description: 'General liability + trade-specific coverage',                   source: 'CRA T2125 — Insurance' },
    { key: 'rbq',            label: 'Trade licence fees',           annualAmount: 540,   description: 'RBQ/trade licence renewals and related fees',                 source: 'CRA T2125 — Licence fees' },
  ],
  C9: [
    { key: 'supplies',       label: 'Products & supplies',          annualAmount: 2160,  description: 'Hair products, skincare, nail supplies, etc.',                 source: 'CRA T2125 — Supplies' },
    { key: 'rent',           label: 'Chair / booth rent',           annualAmount: 7200,  description: 'Salon chair rental or booth fee',                              source: 'CRA T2125 — Rent' },
    { key: 'insurance',      label: 'Liability insurance',          annualAmount: 720,   description: 'Professional liability coverage',                              source: 'CRA T2125 — Insurance' },
    { key: 'phone',          label: 'Phone & internet',             annualAmount: 540,   description: 'Business portion of communications',                          source: 'CRA T2125 — Telephone' },
  ],
  C10: [
    { key: 'rent',           label: 'Studio / space rent',          annualAmount: 9600,  description: 'Gym, studio, or co-working space',                            source: 'CRA T2125 — Rent' },
    { key: 'equipment',      label: 'Equipment (CCA)',              annualAmount: 1800,  description: 'Weights, mats, props — capital cost allowance',                source: 'CRA CCA Class 8' },
    { key: 'insurance',      label: 'Liability insurance',          annualAmount: 960,   description: 'Fitness instructor coverage',                                 source: 'CRA T2125 — Insurance' },
    { key: 'phone',          label: 'Phone & internet',             annualAmount: 540,   description: 'Business portion of communications',                          source: 'CRA T2125 — Telephone' },
  ],
  C11: [
    { key: 'equipment',      label: 'Equipment (CCA)',              annualAmount: 2400,  description: 'Camera, computer, instruments — capital cost allowance',       source: 'CRA CCA Class 8/10' },
    { key: 'software',       label: 'Software & licenses',          annualAmount: 960,   description: 'Adobe, editing tools, plugins',                               source: 'CRA T2125 — Office expenses' },
    { key: 'marketing',      label: 'Portfolio & marketing',        annualAmount: 600,   description: 'Website hosting, social media ads',                           source: 'CRA T2125 — Advertising' },
    { key: 'phone',          label: 'Phone & internet',             annualAmount: 540,   description: 'Business portion of communications',                          source: 'CRA T2125 — Telephone' },
  ],
  C12: [
    { key: 'materials',      label: 'Teaching materials',           annualAmount: 720,   description: 'Workbooks, printing, supplies',                               source: 'CRA T2125 — Supplies' },
    { key: 'software',       label: 'Software & platforms',         annualAmount: 600,   description: 'Zoom, LMS, course platform subscriptions',                    source: 'CRA T2125 — Office expenses' },
    { key: 'phone',          label: 'Phone & internet',             annualAmount: 540,   description: 'Business portion of communications',                          source: 'CRA T2125 — Telephone' },
  ],
};

/**
 * Get the deduction summary for a cluster, with estimated tax savings.
 */
export function getDeductionSummary(clusterId: ClusterID): DeductionSummary {
  const deductions = CLUSTER_DEDUCTIONS[clusterId] ?? CLUSTER_DEDUCTIONS.C2;
  const totalAnnualDeductions = deductions.reduce((sum, d) => sum + d.annualAmount, 0);
  const estimatedTaxSavings = Math.round(totalAnnualDeductions * ESTIMATED_MARGINAL_RATE);

  return {
    deductions,
    totalAnnualDeductions,
    estimatedTaxSavings,
    marginalRateUsed: ESTIMATED_MARGINAL_RATE,
  };
}
