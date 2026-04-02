// ============================================================
// CLUSTER-SPECIFIC FINANCIAL QUESTIONS
// Each business cluster gets a tailored set of questions to
// collect the right inputs for the financial calculator.
// After answering, we compute monthly revenue + expense overrides.
// ============================================================

import type { ClusterID } from '@/lib/clusters';

export type FieldType = 'currency' | 'number' | 'select' | 'boolean';

export interface FinancialQuestion {
  key: string;
  label: string;
  description: string;
  type: FieldType;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[]; // for select type
  suffix?: string;    // e.g. "/hour", "/week"
  defaultValue?: number | string | boolean;
}

export interface ClusterQuestionSet {
  title: string;
  description: string;
  questions: FinancialQuestion[];
  /** Given the user's answers, compute monthly revenue and expense overrides */
  computeFinancials: (answers: Record<string, number | string | boolean>) => {
    monthlyRevenue: number;
    expenseOverrides: Record<string, number>;  // key matches expense-defaults keys
  };
}

// ── C1: Home-based food ────────────────────────────────────────────────────
const C1_QUESTIONS: ClusterQuestionSet = {
  title: 'Home-Based Food Business',
  description: 'Tell us about your food production and sales so we can estimate your costs and revenue.',
  questions: [
    {
      key: 'price_per_item',
      label: 'Average price per item',
      description: 'How much do you charge per item (baked good, meal, etc.)?',
      type: 'currency',
      placeholder: '12',
      defaultValue: 12,
      min: 1,
    },
    {
      key: 'items_per_week',
      label: 'Items sold per week',
      description: 'How many items do you expect to sell each week?',
      type: 'number',
      placeholder: '40',
      defaultValue: 40,
      min: 1,
    },
    {
      key: 'ingredient_cost_pct',
      label: 'Ingredient cost (% of price)',
      description: 'What percentage of your selling price goes to ingredients? Most home bakers spend 30-40%.',
      type: 'number',
      placeholder: '35',
      defaultValue: 35,
      min: 10,
      max: 80,
      suffix: '%',
    },
    {
      key: 'sells_at_market',
      label: 'Do you sell at farmers markets?',
      description: 'Market stall fees are typically $40-80/week.',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'does_delivery',
      label: 'Do you make deliveries?',
      description: 'Delivery driving is deductible at $0.72/km.',
      type: 'boolean',
      defaultValue: true,
    },
  ],
  computeFinancials: (a) => {
    const price = Number(a.price_per_item) || 12;
    const items = Number(a.items_per_week) || 40;
    const costPct = Number(a.ingredient_cost_pct) || 35;
    const weeklyRevenue = price * items;
    const monthlyRevenue = weeklyRevenue * 4.33;
    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        ingredients: Math.round((costPct / 100) * monthlyRevenue),
        packaging: Math.round(items * 4.33 * 1.5),  // ~$1.50 per item for packaging
        market_fees: a.sells_at_market ? 60 : 0,
        delivery: a.does_delivery ? 45 : 0,
      },
    };
  },
};

// ── C2: Freelance / consulting ─────────────────────────────────────────────
const C2_QUESTIONS: ClusterQuestionSet = {
  title: 'Freelance & Consulting',
  description: 'Tell us about your rates and workload so we can project your income and taxes.',
  questions: [
    {
      key: 'rate_type',
      label: 'How do you charge?',
      description: 'Select your billing model.',
      type: 'select',
      options: [
        { value: 'hourly', label: 'Hourly rate' },
        { value: 'daily', label: 'Daily rate' },
        { value: 'project', label: 'Per project' },
        { value: 'monthly', label: 'Monthly retainer' },
      ],
      defaultValue: 'hourly',
    },
    {
      key: 'rate_amount',
      label: 'Your rate',
      description: 'How much do you charge per hour/day/project/month?',
      type: 'currency',
      placeholder: '75',
      defaultValue: 75,
      min: 10,
    },
    {
      key: 'billable_hours_week',
      label: 'Billable hours per week',
      description: 'Realistically, most freelancers bill 20-30 hours/week (the rest is admin, marketing, etc.).',
      type: 'number',
      placeholder: '25',
      defaultValue: 25,
      min: 1,
      max: 60,
      suffix: 'hrs/week',
    },
    {
      key: 'works_from_home',
      label: 'Do you work from home?',
      description: 'You can deduct a portion of rent, utilities, and internet.',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'software_cost',
      label: 'Monthly software & tools cost',
      description: 'IDE, design tools, project management, hosting, etc.',
      type: 'currency',
      placeholder: '120',
      defaultValue: 120,
      min: 0,
    },
  ],
  computeFinancials: (a) => {
    const rateType = String(a.rate_type) || 'hourly';
    const rate = Number(a.rate_amount) || 75;
    const hours = Number(a.billable_hours_week) || 25;

    let monthlyRevenue: number;
    if (rateType === 'hourly') {
      monthlyRevenue = rate * hours * 4.33;
    } else if (rateType === 'daily') {
      monthlyRevenue = rate * (hours / 8) * 4.33;
    } else if (rateType === 'project') {
      // Assume 2 projects/month at that rate
      monthlyRevenue = rate * 2;
    } else {
      monthlyRevenue = rate; // monthly retainer
    }

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        software: Number(a.software_cost) || 120,
        home_office: a.works_from_home ? 200 : 0,
        phone: 45,
      },
    };
  },
};

// ── C3: Regulated childcare ────────────────────────────────────────────────
const C3_QUESTIONS: ClusterQuestionSet = {
  title: 'Home Childcare',
  description: 'Tell us about your daycare setup so we can calculate your income and costs.',
  questions: [
    {
      key: 'num_children',
      label: 'Number of children',
      description: 'Home daycares in Québec can care for up to 6 children (or 9 with an assistant).',
      type: 'number',
      placeholder: '6',
      defaultValue: 6,
      min: 1,
      max: 9,
    },
    {
      key: 'daily_rate',
      label: 'Daily rate per child',
      description: 'Subsidized rate is ~$9.10/day; private can be $35-55/day.',
      type: 'currency',
      placeholder: '40',
      defaultValue: 40,
      min: 5,
    },
    {
      key: 'days_per_week',
      label: 'Days open per week',
      description: 'Most home daycares operate 5 days/week.',
      type: 'number',
      placeholder: '5',
      defaultValue: 5,
      min: 1,
      max: 7,
    },
    {
      key: 'is_subsidized',
      label: 'Will you be subsidized?',
      description: 'Subsidized daycares charge the government rate but receive a per-child grant.',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  computeFinancials: (a) => {
    const children = Number(a.num_children) || 6;
    const dailyRate = Number(a.daily_rate) || 40;
    const daysPerWeek = Number(a.days_per_week) || 5;
    const monthlyRevenue = children * dailyRate * daysPerWeek * 4.33;

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        food: Math.round(children * 30),         // ~$30/child/month for meals
        supplies: Math.round(children * 13),      // ~$13/child/month
        insurance: 55,
        cleaning: 35,
      },
    };
  },
};

// ── C4: Regulated professional ─────────────────────────────────────────────
const C4_QUESTIONS: ClusterQuestionSet = {
  title: 'Regulated Professional Practice',
  description: 'Tell us about your practice so we can estimate your income and professional costs.',
  questions: [
    {
      key: 'fee_per_session',
      label: 'Fee per client / session',
      description: 'Your standard consultation or session fee.',
      type: 'currency',
      placeholder: '150',
      defaultValue: 150,
      min: 20,
    },
    {
      key: 'clients_per_week',
      label: 'Clients per week',
      description: 'How many client sessions do you expect per week?',
      type: 'number',
      placeholder: '15',
      defaultValue: 15,
      min: 1,
      max: 50,
    },
    {
      key: 'has_office',
      label: 'Do you rent an office or coworking space?',
      description: 'Many regulated professionals need a dedicated practice space.',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'office_rent',
      label: 'Monthly office rent',
      description: 'If applicable, your monthly office lease or coworking cost.',
      type: 'currency',
      placeholder: '300',
      defaultValue: 300,
      min: 0,
    },
    {
      key: 'annual_order_dues',
      label: 'Annual professional order dues',
      description: 'Your yearly dues to your professional order (e.g. OPQ, Barreau).',
      type: 'currency',
      placeholder: '1500',
      defaultValue: 1500,
      min: 0,
    },
  ],
  computeFinancials: (a) => {
    const fee = Number(a.fee_per_session) || 150;
    const clients = Number(a.clients_per_week) || 15;
    const monthlyRevenue = fee * clients * 4.33;

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        order_fees: Math.round((Number(a.annual_order_dues) || 1500) / 12),
        insurance: 150,
        office: a.has_office ? (Number(a.office_rent) || 300) : 0,
        software: 80,
      },
    };
  },
};

// ── C5: Retail / product sales ─────────────────────────────────────────────
const C5_QUESTIONS: ClusterQuestionSet = {
  title: 'Retail & Product Sales',
  description: 'Tell us about your products so we can estimate inventory costs and revenue.',
  questions: [
    {
      key: 'avg_product_price',
      label: 'Average product selling price',
      description: 'The average price a customer pays for one item.',
      type: 'currency',
      placeholder: '35',
      defaultValue: 35,
      min: 1,
    },
    {
      key: 'units_per_month',
      label: 'Expected units sold per month',
      description: 'How many items do you expect to sell each month?',
      type: 'number',
      placeholder: '80',
      defaultValue: 80,
      min: 1,
    },
    {
      key: 'cost_per_unit',
      label: 'Cost per unit (wholesale / materials)',
      description: 'What does each unit cost you to acquire or make?',
      type: 'currency',
      placeholder: '15',
      defaultValue: 15,
      min: 0,
    },
    {
      key: 'sells_online',
      label: 'Sales channel',
      description: 'Platform fees vary: Shopify ~$40/mo, Etsy ~$0.20/listing + 6.5% fees.',
      type: 'select',
      options: [
        { value: 'online', label: 'Online only (Shopify, Etsy, etc.)' },
        { value: 'inperson', label: 'In-person only (market, pop-up)' },
        { value: 'both', label: 'Both online and in-person' },
      ],
      defaultValue: 'both',
    },
    {
      key: 'ships_products',
      label: 'Do you ship products?',
      description: 'Shipping costs average $8-15 per package within Canada.',
      type: 'boolean',
      defaultValue: true,
    },
  ],
  computeFinancials: (a) => {
    const price = Number(a.avg_product_price) || 35;
    const units = Number(a.units_per_month) || 80;
    const cost = Number(a.cost_per_unit) || 15;
    const monthlyRevenue = price * units;
    const channel = String(a.sells_online) || 'both';

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        inventory: Math.round(cost * units),
        shipping: a.ships_products ? Math.round(units * 10) : 0,
        platform: channel === 'inperson' ? 0 : channel === 'online' ? 50 : 40,
        marketing: 60,
      },
    };
  },
};

// ── C6: Food service / hospitality ─────────────────────────────────────────
const C6_QUESTIONS: ClusterQuestionSet = {
  title: 'Food Service & Hospitality',
  description: 'Tell us about your restaurant or food service so we can estimate your costs accurately.',
  questions: [
    {
      key: 'expected_monthly_revenue',
      label: 'Expected monthly revenue',
      description: 'Your total projected monthly sales (food + drinks).',
      type: 'currency',
      placeholder: '8000',
      defaultValue: 8000,
      min: 500,
    },
    {
      key: 'monthly_rent',
      label: 'Monthly rent',
      description: 'Rent for your commercial kitchen / restaurant space.',
      type: 'currency',
      placeholder: '1200',
      defaultValue: 1200,
      min: 0,
    },
    {
      key: 'food_cost_pct',
      label: 'Food cost percentage',
      description: 'What % of revenue goes to ingredients? Industry average is 28-35%.',
      type: 'number',
      placeholder: '30',
      defaultValue: 30,
      min: 15,
      max: 60,
      suffix: '%',
    },
    {
      key: 'num_seats',
      label: 'Number of seats / capacity',
      description: 'Your restaurant seating capacity (for overhead estimation).',
      type: 'number',
      placeholder: '20',
      defaultValue: 20,
      min: 0,
    },
    {
      key: 'serves_alcohol',
      label: 'Do you serve alcohol?',
      description: 'Requires an RACJ permit (~$600/year) but higher margins.',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  computeFinancials: (a) => {
    const revenue = Number(a.expected_monthly_revenue) || 8000;
    const rent = Number(a.monthly_rent) || 1200;
    const foodPct = Number(a.food_cost_pct) || 30;

    return {
      monthlyRevenue: revenue,
      expenseOverrides: {
        ingredients: Math.round((foodPct / 100) * revenue),
        rent: rent,
        utilities: 200,
        equipment: 150,
        insurance: 100,
        permits: a.serves_alcohol ? 90 : 40,  // RACJ adds ~$50/mo amortized
      },
    };
  },
};

// ── C7: Construction / trades ──────────────────────────────────────────────
const C7_QUESTIONS: ClusterQuestionSet = {
  title: 'Construction & Trades',
  description: 'Tell us about your contracting work so we can estimate your job revenue and material costs.',
  questions: [
    {
      key: 'avg_job_value',
      label: 'Average job / contract value',
      description: 'The average value of one job or contract.',
      type: 'currency',
      placeholder: '3000',
      defaultValue: 3000,
      min: 100,
    },
    {
      key: 'jobs_per_month',
      label: 'Jobs per month',
      description: 'How many jobs or contracts do you complete monthly?',
      type: 'number',
      placeholder: '3',
      defaultValue: 3,
      min: 1,
      max: 30,
    },
    {
      key: 'material_cost_pct',
      label: 'Material cost (% of job value)',
      description: 'What percentage of each job goes to materials? Typically 30-50%.',
      type: 'number',
      placeholder: '35',
      defaultValue: 35,
      min: 10,
      max: 70,
      suffix: '%',
    },
    {
      key: 'has_vehicle',
      label: 'Do you own/lease a work vehicle?',
      description: 'Truck lease, insurance, gas, and maintenance are all deductible.',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'vehicle_monthly',
      label: 'Monthly vehicle cost',
      description: 'Total monthly cost for lease/loan + insurance + gas + maintenance.',
      type: 'currency',
      placeholder: '350',
      defaultValue: 350,
      min: 0,
    },
  ],
  computeFinancials: (a) => {
    const jobValue = Number(a.avg_job_value) || 3000;
    const jobs = Number(a.jobs_per_month) || 3;
    const materialPct = Number(a.material_cost_pct) || 35;
    const monthlyRevenue = jobValue * jobs;

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        materials: Math.round((materialPct / 100) * monthlyRevenue),
        vehicle: a.has_vehicle ? (Number(a.vehicle_monthly) || 350) : 0,
        tools: 120,
        insurance: 180,
        licence: 45,
      },
    };
  },
};

// ── C8: Personal services ──────────────────────────────────────────────────
const C8_QUESTIONS: ClusterQuestionSet = {
  title: 'Personal Services',
  description: 'Tell us about your service offerings so we can estimate your income and costs.',
  questions: [
    {
      key: 'price_per_service',
      label: 'Price per service / session',
      description: 'Your standard price for one service (haircut, massage, treatment, etc.).',
      type: 'currency',
      placeholder: '60',
      defaultValue: 60,
      min: 10,
    },
    {
      key: 'sessions_per_week',
      label: 'Sessions per week',
      description: 'How many clients do you serve per week?',
      type: 'number',
      placeholder: '20',
      defaultValue: 20,
      min: 1,
      max: 50,
    },
    {
      key: 'rents_chair',
      label: 'Do you rent a chair or room?',
      description: 'Salon chair rental or treatment room rental.',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'chair_rent',
      label: 'Monthly chair / room rental',
      description: 'How much do you pay per month to rent your workspace?',
      type: 'currency',
      placeholder: '300',
      defaultValue: 300,
      min: 0,
    },
    {
      key: 'product_cost_monthly',
      label: 'Monthly product / supply cost',
      description: 'Hair products, oils, tools, disposables, etc.',
      type: 'currency',
      placeholder: '150',
      defaultValue: 150,
      min: 0,
    },
  ],
  computeFinancials: (a) => {
    const price = Number(a.price_per_service) || 60;
    const sessions = Number(a.sessions_per_week) || 20;
    const monthlyRevenue = price * sessions * 4.33;

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        products: Number(a.product_cost_monthly) || 150,
        rent: a.rents_chair ? (Number(a.chair_rent) || 300) : 0,
        insurance: 45,
        tools: 40,
        marketing: 30,
      },
    };
  },
};

// ── C9: General / unknown ──────────────────────────────────────────────────
const C9_QUESTIONS: ClusterQuestionSet = {
  title: 'Your Business',
  description: 'Tell us the basics so we can estimate your finances.',
  questions: [
    {
      key: 'expected_monthly_revenue',
      label: 'Expected monthly revenue',
      description: 'Your best estimate of monthly gross revenue.',
      type: 'currency',
      placeholder: '3000',
      defaultValue: 3000,
      min: 0,
    },
    {
      key: 'monthly_expenses_estimate',
      label: 'Estimated monthly expenses',
      description: 'Total business expenses you expect per month.',
      type: 'currency',
      placeholder: '500',
      defaultValue: 500,
      min: 0,
    },
    {
      key: 'works_from_home',
      label: 'Do you work from home?',
      description: 'Home office expenses are partially deductible.',
      type: 'boolean',
      defaultValue: true,
    },
  ],
  computeFinancials: (a) => {
    return {
      monthlyRevenue: Number(a.expected_monthly_revenue) || 3000,
      expenseOverrides: {
        general: Number(a.monthly_expenses_estimate) || 500,
        phone: 45,
        software: a.works_from_home ? 40 : 0,
      },
    };
  },
};

// ── Master map ─────────────────────────────────────────────────────────────

export const CLUSTER_QUESTIONS: Record<ClusterID, ClusterQuestionSet> = {
  C1: C1_QUESTIONS,
  C2: C2_QUESTIONS,
  C3: C3_QUESTIONS,
  C4: C4_QUESTIONS,
  C5: C5_QUESTIONS,
  C6: C6_QUESTIONS,
  C7: C7_QUESTIONS,
  C8: C8_QUESTIONS,
  C9: C9_QUESTIONS,
};

/**
 * Get the cluster-specific question set for a given cluster ID.
 */
export function getClusterQuestions(clusterId: ClusterID): ClusterQuestionSet {
  return CLUSTER_QUESTIONS[clusterId] ?? CLUSTER_QUESTIONS.C9;
}
