// ============================================================
// CLUSTER-AWARE EXPENSE DEFAULTS
// Pre-fills expenses by category for each business cluster.
// The user sees these pre-filled and adjusts — much faster
// than starting from zero.
// ============================================================

import type { ClusterID } from '@/lib/clusters';

export interface ExpenseCategory {
  key: string;
  label: string;
  amount: number;       // monthly $
  description: string;  // why this exists
}

export interface ClusterExpenseProfile {
  categories: ExpenseCategory[];
  total: number;        // sum of all categories
  hint: string;         // one-line summary for the UI
}

const CLUSTER_EXPENSES: Record<ClusterID, ClusterExpenseProfile> = {
  // C1: Home-based food
  C1: {
    categories: [
      { key: 'ingredients',  label: 'Ingredients',        amount: 250, description: 'Flour, butter, sugar, seasonal produce' },
      { key: 'packaging',    label: 'Packaging',          amount: 80,  description: 'Boxes, bags, labels, stickers' },
      { key: 'market_fees',  label: 'Market stall fees',  amount: 60,  description: 'Weekly farmers market or pop-up rental' },
      { key: 'delivery',     label: 'Delivery / mileage', amount: 45,  description: '$0.72/km × ~60km/week deliveries & markets' },
      { key: 'insurance',    label: 'Liability insurance', amount: 30, description: 'Home-based food business insurance' },
      { key: 'permits',      label: 'Permits & renewals', amount: 15,  description: 'MAPAQ permit renewal (amortized monthly)' },
    ],
    total: 480,
    hint: 'Ingredients ~$250, packaging ~$80, market fees ~$60, delivery ~$45',
  },

  // C2: Freelance / consulting
  C2: {
    categories: [
      { key: 'software',     label: 'Software & SaaS',     amount: 120, description: 'IDE, design tools, project management, hosting' },
      { key: 'home_office',  label: 'Home office (prorated)', amount: 200, description: '~10% of rent/mortgage + utilities if WFH' },
      { key: 'phone',        label: 'Phone & internet',    amount: 45,  description: 'Business portion of phone plan + internet' },
      { key: 'professional', label: 'Professional dev',    amount: 30,  description: 'Online courses, conferences, books' },
      { key: 'accounting',   label: 'Accounting software', amount: 25,  description: 'QuickBooks, FreshBooks, or similar' },
    ],
    total: 420,
    hint: 'Software ~$120, home office ~$200, phone ~$45',
  },

  // C3: Regulated childcare
  C3: {
    categories: [
      { key: 'food',         label: 'Children\'s meals',   amount: 180, description: 'Meals and snacks for enrolled children' },
      { key: 'supplies',     label: 'Toys & supplies',     amount: 80,  description: 'Art supplies, educational toys, books' },
      { key: 'safety',       label: 'Safety & first aid',  amount: 20,  description: 'First aid kit, baby-proofing, fire safety' },
      { key: 'insurance',    label: 'Childcare insurance', amount: 55,  description: 'Liability insurance specific to daycare' },
      { key: 'cleaning',     label: 'Cleaning supplies',   amount: 35,  description: 'Sanitizer, wipes, laundry for linens' },
      { key: 'training',     label: 'Required training',   amount: 15,  description: 'CPR renewal, mandatory workshops (amortized)' },
    ],
    total: 385,
    hint: 'Children\'s food ~$180, supplies ~$80, insurance ~$55',
  },

  // C4: Regulated professional
  C4: {
    categories: [
      { key: 'order_fees',   label: 'Professional order dues', amount: 125, description: 'Annual dues to your professional order (amortized)' },
      { key: 'insurance',    label: 'Professional liability',  amount: 150, description: 'Errors & omissions insurance' },
      { key: 'office',       label: 'Office / coworking',      amount: 300, description: 'Office lease or coworking membership' },
      { key: 'software',     label: 'Professional software',   amount: 80,  description: 'Industry-specific tools and subscriptions' },
      { key: 'education',    label: 'Continuing education',    amount: 60,  description: 'Mandatory CE credits (amortized monthly)' },
    ],
    total: 715,
    hint: 'Office ~$300, insurance ~$150, professional dues ~$125',
  },

  // C5: Online retail
  C5: {
    categories: [
      { key: 'inventory',      label: 'Product cost (COGS)',    amount: 400, description: 'Supplier/wholesale cost for sold units' },
      { key: 'shipping',       label: 'Shipping',               amount: 80,  description: 'Shipping labels, courier fees, returns' },
      { key: 'packaging',      label: 'Packaging',              amount: 60,  description: 'Boxes, mailers, inserts, labels' },
      { key: 'platform_fees',  label: 'Platform & payment fees', amount: 50, description: 'Shopify/Etsy/Amazon + payment processing' },
      { key: 'advertising',    label: 'Ads & customer acquisition', amount: 100, description: 'Meta/Google/TikTok ads, influencer costs' },
      { key: 'software',       label: 'Store software',         amount: 20,  description: 'Email tools, analytics, bookkeeping apps' },
    ],
    total: 710,
    hint: 'COGS ~$400, ads ~$100, shipping + packaging ~$140',
  },

  // C6: Physical retail
  C6: {
    categories: [
      { key: 'inventory',         label: 'Inventory / COGS',       amount: 700,  description: 'Wholesale stock purchased for resale' },
      { key: 'rent',              label: 'Store rent',             amount: 1500, description: 'Lease for retail storefront or kiosk' },
      { key: 'utilities',         label: 'Utilities',              amount: 150,  description: 'Hydro, internet, heating/cooling' },
      { key: 'pos_system',        label: 'POS system',             amount: 50,   description: 'Square/Lightspeed monthly plan + hardware' },
      { key: 'insurance',         label: 'Business insurance',     amount: 80,   description: 'General liability + contents coverage' },
      { key: 'signage_marketing', label: 'Signage & local marketing', amount: 75, description: 'Store signage, flyers, local promo spend' },
      { key: 'online_platform',   label: 'Online store add-on',    amount: 0,    description: 'Extra platform cost if you also sell online' },
    ],
    total: 2555,
    hint: 'Rent ~$1500, inventory ~$700, utilities/POS/insurance overhead',
  },

  // C7: Restaurant & food service
  C7: {
    categories: [
      { key: 'ingredients',  label: 'Food & beverage cost', amount: 2400, description: 'Typical 28-35% of revenue for ingredients' },
      { key: 'rent',         label: 'Commercial rent',      amount: 1200, description: 'Kitchen, counter, or dining-space lease' },
      { key: 'utilities',    label: 'Utilities',            amount: 200,  description: 'Hydro, gas, water for food operations' },
      { key: 'equipment',    label: 'Kitchen equipment',    amount: 150,  description: 'Equipment lease, maintenance, replacement' },
      { key: 'insurance',    label: 'Hospitality insurance', amount: 100, description: 'Liability, property, and food-related coverage' },
      { key: 'permits',      label: 'Permits & licences',   amount: 40,   description: 'MAPAQ/RACJ/municipal permits (amortized)' },
    ],
    total: 4090,
    hint: 'Food cost + rent dominate expenses for most restaurants',
  },

  // C8: Construction & trades
  C8: {
    categories: [
      { key: 'materials',    label: 'Materials & supplies', amount: 500, description: 'Lumber, fittings, wires, consumables per job' },
      { key: 'vehicle',      label: 'Vehicle & fuel',       amount: 350, description: 'Truck/van lease, gas, maintenance, parking' },
      { key: 'tools',        label: 'Tools & equipment',    amount: 120, description: 'Tool wear/replacement and small equipment' },
      { key: 'insurance',    label: 'Contractor insurance', amount: 180, description: 'General liability + job-site coverage' },
      { key: 'licence',      label: 'Licences & certifications', amount: 45, description: 'RBQ/trade certifications (amortized monthly)' },
    ],
    total: 1195,
    hint: 'Materials + vehicle are typically the largest monthly costs',
  },

  // C9: Personal care & beauty
  C9: {
    categories: [
      { key: 'supplies',     label: 'Products & supplies', amount: 180, description: 'Hair products, nail polish, skincare, etc.' },
      { key: 'rent',         label: 'Chair / booth rent',  amount: 400, description: 'Chair rental, treatment room, or studio share' },
      { key: 'insurance',    label: 'Liability insurance', amount: 60,  description: 'Professional liability coverage' },
      { key: 'tools',        label: 'Tools & upkeep',      amount: 40,  description: 'Scissors, clippers, nail tools, sterilization' },
      { key: 'marketing',    label: 'Marketing',           amount: 40,  description: 'Social media, booking platform' },
      { key: 'home_office',  label: 'Home workspace share', amount: 0,  description: 'Set >0 only if part of your home is used for business' },
    ],
    total: 720,
    hint: 'Depends heavily on workspace model (chair rental vs home vs mobile)',
  },
  // C10: Fitness & wellness
  C10: {
    categories: [
      { key: 'rent',         label: 'Studio / space rent',  amount: 800,  description: 'Gym, studio, or co-working space' },
      { key: 'equipment',    label: 'Equipment',            amount: 150,  description: 'Weights, mats, props — amortized monthly' },
      { key: 'insurance',    label: 'Liability insurance',  amount: 80,   description: 'Fitness instructor coverage' },
      { key: 'marketing',    label: 'Marketing',            amount: 60,   description: 'Social media, website, booking app' },
      { key: 'phone',        label: 'Phone & internet',     amount: 45,   description: 'Business communications' },
    ],
    total: 1135,
    hint: 'Adjust studio rent if working from home or outdoors',
  },
  // C11: Creative & media
  C11: {
    categories: [
      { key: 'equipment',    label: 'Equipment',            amount: 200,  description: 'Camera, computer, instruments — amortized' },
      { key: 'software',     label: 'Software & licenses',  amount: 80,   description: 'Adobe, editing tools, plugins' },
      { key: 'rent',         label: 'Studio rent',          amount: 0,    description: 'Studio or co-working space' },
      { key: 'marketing',    label: 'Marketing / portfolio', amount: 50,  description: 'Website hosting, social media, ads' },
      { key: 'phone',        label: 'Phone & internet',     amount: 45,   description: 'Business communications' },
    ],
    total: 375,
    hint: 'Low overhead — most costs are equipment & software',
  },
  // C12: Education & tutoring
  C12: {
    categories: [
      { key: 'materials',    label: 'Teaching materials',    amount: 60,   description: 'Workbooks, printing, supplies' },
      { key: 'software',     label: 'Software & platforms',  amount: 50,   description: 'Zoom, course platform, LMS' },
      { key: 'marketing',    label: 'Marketing',             amount: 40,   description: 'Social media, referral programs' },
      { key: 'phone',        label: 'Phone & internet',      amount: 45,   description: 'Business communications' },
    ],
    total: 195,
    hint: 'Very low overhead — mostly your time',
  },
};

/**
 * Get the full expense profile for a cluster.
 */
export function getExpenseDefaults(clusterId: ClusterID): ClusterExpenseProfile {
  return CLUSTER_EXPENSES[clusterId] ?? CLUSTER_EXPENSES.C2;
}

/**
 * Backwards-compatible: get just the total default expense
 * from a business_type string (used by snapshot-card.tsx).
 */
export function getDefaultExpenseTotal(businessType: string): number {
  const typeToCluster: Record<string, ClusterID> = {
    food: 'C1', freelance: 'C2', daycare: 'C3', retail: 'C5',
    personal_care: 'C9', tech: 'C2', creative: 'C11', other: 'C2',
  };
  const cid = typeToCluster[businessType] ?? 'C2';
  return CLUSTER_EXPENSES[cid].total;
}
