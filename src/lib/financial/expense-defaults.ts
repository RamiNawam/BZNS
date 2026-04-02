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

  // C5: Retail / product sales
  C5: {
    categories: [
      { key: 'inventory',    label: 'Inventory / COGS',    amount: 400, description: 'Cost of goods purchased for resale' },
      { key: 'shipping',     label: 'Shipping & packaging', amount: 80, description: 'Canada Post, courier, packaging materials' },
      { key: 'platform',     label: 'Platform fees',       amount: 50,  description: 'Shopify, Etsy, Square, payment processing' },
      { key: 'marketing',    label: 'Marketing & ads',     amount: 60,  description: 'Social media ads, flyers, business cards' },
      { key: 'insurance',    label: 'Business insurance',  amount: 35,  description: 'General liability for retail' },
    ],
    total: 625,
    hint: 'Inventory ~$400, shipping ~$80, platform fees ~$50',
  },

  // C6: Food service / hospitality
  C6: {
    categories: [
      { key: 'ingredients',  label: 'Food & beverage cost', amount: 800, description: '~30% of revenue for ingredients' },
      { key: 'rent',         label: 'Commercial rent',      amount: 1200, description: 'Lease for commercial kitchen/space' },
      { key: 'utilities',    label: 'Utilities',            amount: 200, description: 'Hydro, gas, water for commercial kitchen' },
      { key: 'equipment',    label: 'Equipment lease',      amount: 150, description: 'Commercial equipment lease payments' },
      { key: 'insurance',    label: 'Restaurant insurance', amount: 100, description: 'Liability + property insurance' },
      { key: 'permits',      label: 'Permits & licences',   amount: 40,  description: 'MAPAQ, RACJ, municipal permits (amortized)' },
    ],
    total: 2490,
    hint: 'Rent ~$1200, food cost ~$800, utilities ~$200',
  },

  // C7: Construction / trades
  C7: {
    categories: [
      { key: 'materials',    label: 'Materials & supplies', amount: 500, description: 'Lumber, electrical, plumbing supplies' },
      { key: 'vehicle',      label: 'Vehicle / fuel',      amount: 350, description: 'Truck lease/maintenance + fuel for job sites' },
      { key: 'tools',        label: 'Tools & equipment',   amount: 120, description: 'Tool replacement and maintenance' },
      { key: 'insurance',    label: 'Contractor insurance', amount: 180, description: 'General liability + RBQ requirements' },
      { key: 'licence',      label: 'RBQ licence',         amount: 45,  description: 'Annual RBQ licence fee (amortized)' },
      { key: 'phone',        label: 'Phone & scheduling',  amount: 40,  description: 'Business phone + job scheduling software' },
    ],
    total: 1235,
    hint: 'Materials ~$500, vehicle ~$350, insurance ~$180',
  },

  // C8: Personal services
  C8: {
    categories: [
      { key: 'products',     label: 'Products & supplies', amount: 150, description: 'Hair products, massage oils, esthetics supplies' },
      { key: 'rent',         label: 'Chair/room rental',   amount: 300, description: 'Salon chair rental or treatment room' },
      { key: 'insurance',    label: 'Liability insurance', amount: 45,  description: 'Professional liability for personal services' },
      { key: 'tools',        label: 'Tools & equipment',   amount: 40,  description: 'Scissors, machines, treatment equipment' },
      { key: 'marketing',    label: 'Marketing',           amount: 30,  description: 'Social media, booking platform, business cards' },
    ],
    total: 565,
    hint: 'Chair/room rental ~$300, products ~$150, insurance ~$45',
  },

  // C9: General / unknown
  C9: {
    categories: [
      { key: 'general',      label: 'General supplies',    amount: 100, description: 'Varies by business type' },
      { key: 'phone',        label: 'Phone & internet',    amount: 45,  description: 'Business communications' },
      { key: 'software',     label: 'Software',            amount: 40,  description: 'Basic business tools' },
      { key: 'insurance',    label: 'Basic insurance',     amount: 30,  description: 'General liability coverage' },
    ],
    total: 215,
    hint: 'Adjust based on your actual costs',
  },
};

/**
 * Get the full expense profile for a cluster.
 */
export function getExpenseDefaults(clusterId: ClusterID): ClusterExpenseProfile {
  return CLUSTER_EXPENSES[clusterId] ?? CLUSTER_EXPENSES.C9;
}

/**
 * Backwards-compatible: get just the total default expense
 * from a business_type string (used by snapshot-card.tsx).
 */
export function getDefaultExpenseTotal(businessType: string): number {
  const typeToCluster: Record<string, ClusterID> = {
    food: 'C1', freelance: 'C2', daycare: 'C3', retail: 'C5',
    personal_care: 'C8', tech: 'C2', creative: 'C2', other: 'C9',
  };
  const cid = typeToCluster[businessType] ?? 'C9';
  return CLUSTER_EXPENSES[cid].total;
}
