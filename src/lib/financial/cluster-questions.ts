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

// ── C5: Online retail (dropshipping, Etsy, Shopify) ────────────────────────
const C5_QUESTIONS: ClusterQuestionSet = {
  title: 'Online Retail Business',
  description: 'Tell us about your online store so we can estimate your revenue, platform costs, and margins.',
  questions: [
    {
      key: 'avg_product_price',
      label: 'Average selling price per item',
      description: 'The average price a customer pays for one item on your store.',
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
      label: 'Cost per unit (wholesale / supplier)',
      description: 'What does each unit cost you to buy or produce?',
      type: 'currency',
      placeholder: '15',
      defaultValue: 15,
      min: 0,
    },
    {
      key: 'platform',
      label: 'Selling platform',
      description: 'Where do you mainly sell? Platform fees differ.',
      type: 'select',
      options: [
        { value: 'shopify', label: 'Shopify (~$40/mo + payment fees)' },
        { value: 'etsy', label: 'Etsy ($0.20/listing + 6.5% fees)' },
        { value: 'amazon', label: 'Amazon (~15% referral fee)' },
        { value: 'own_site', label: 'Own website (Stripe / PayPal fees only)' },
        { value: 'social', label: 'Social media (Instagram, Facebook)' },
      ],
      defaultValue: 'shopify',
    },
    {
      key: 'ships_products',
      label: 'Do you handle shipping yourself?',
      description: 'Shipping costs average $8-15 per package within Canada.',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'monthly_ad_spend',
      label: 'Monthly advertising budget',
      description: 'Facebook/Instagram ads, Google Ads, influencer sponsorships, etc.',
      type: 'currency',
      placeholder: '100',
      defaultValue: 100,
      min: 0,
    },
  ],
  computeFinancials: (a) => {
    const price = Number(a.avg_product_price) || 35;
    const units = Number(a.units_per_month) || 80;
    const cost = Number(a.cost_per_unit) || 15;
    const monthlyRevenue = price * units;
    const platform = String(a.platform) || 'shopify';

    // Platform fees vary
    const platformFees: Record<string, number> = {
      shopify: 40 + monthlyRevenue * 0.029,   // $40/mo + 2.9% payment processing
      etsy: units * 0.20 + monthlyRevenue * 0.065,  // listing + transaction fees
      amazon: monthlyRevenue * 0.15,           // ~15% referral fee
      own_site: monthlyRevenue * 0.029,        // Stripe ~2.9%
      social: monthlyRevenue * 0.029,          // payment processing only
    };

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        inventory: Math.round(cost * units),
        shipping: a.ships_products ? Math.round(units * 10) : 0,
        platform_fees: Math.round(platformFees[platform] ?? 40),
        advertising: Number(a.monthly_ad_spend) || 100,
        packaging: Math.round(units * 1.5),
        software: 20,  // accounting, email marketing
      },
    };
  },
};

// ── C6: Physical retail (brick-and-mortar, pop-up, market stall) ──────────
const C6_QUESTIONS: ClusterQuestionSet = {
  title: 'Physical Retail Store',
  description: 'Tell us about your store so we can estimate rent, inventory, and operating costs.',
  questions: [
    {
      key: 'avg_product_price',
      label: 'Average selling price per item',
      description: 'The average price a customer pays for one item.',
      type: 'currency',
      placeholder: '40',
      defaultValue: 40,
      min: 1,
    },
    {
      key: 'units_per_month',
      label: 'Expected units sold per month',
      description: 'How many items do you expect to sell each month?',
      type: 'number',
      placeholder: '150',
      defaultValue: 150,
      min: 1,
    },
    {
      key: 'cost_per_unit',
      label: 'Cost per unit (wholesale / materials)',
      description: 'What does each unit cost you to acquire or produce?',
      type: 'currency',
      placeholder: '18',
      defaultValue: 18,
      min: 0,
    },
    {
      key: 'monthly_rent',
      label: 'Monthly store rent',
      description: 'Rent for your retail space, market stall, or pop-up location.',
      type: 'currency',
      placeholder: '1500',
      defaultValue: 1500,
      min: 0,
    },
    {
      key: 'has_pos_system',
      label: 'Do you use a POS system?',
      description: 'Point-of-sale systems cost $30-80/mo (Square, Clover, Lightspeed).',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'also_sells_online',
      label: 'Do you also sell online?',
      description: 'An online presence adds platform fees but broadens your market.',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  computeFinancials: (a) => {
    const price = Number(a.avg_product_price) || 40;
    const units = Number(a.units_per_month) || 150;
    const cost = Number(a.cost_per_unit) || 18;
    const rent = Number(a.monthly_rent) || 1500;
    const monthlyRevenue = price * units;

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        inventory: Math.round(cost * units),
        rent: rent,
        utilities: 150,
        pos_system: a.has_pos_system ? 50 : 0,
        insurance: 80,
        signage_marketing: 75,
        online_platform: a.also_sells_online ? 40 : 0,
      },
    };
  },
};

// ── C7: Restaurant & food service ─────────────────────────────────────────
const C7_QUESTIONS: ClusterQuestionSet = {
  title: 'Restaurant & Food Service',
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
      description: 'Your restaurant seating capacity (for overhead estimation). 0 if takeout/delivery only.',
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

// ── C8: Construction & trades ──────────────────────────────────────────────
const C8_QUESTIONS: ClusterQuestionSet = {
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

// ── C9: Personal care & beauty ─────────────────────────────────────────────
const C9_QUESTIONS: ClusterQuestionSet = {
  title: 'Personal Care & Beauty',
  description: 'Tell us about your beauty or personal care services so we can estimate your income and costs.',
  questions: [
    {
      key: 'price_per_service',
      label: 'Average price per service',
      description: 'Your standard price for one service (haircut, lashes, nails, massage, etc.).',
      type: 'currency',
      placeholder: '60',
      defaultValue: 60,
      min: 10,
    },
    {
      key: 'clients_per_week',
      label: 'Clients per week',
      description: 'How many clients do you serve per week?',
      type: 'number',
      placeholder: '20',
      defaultValue: 20,
      min: 1,
      max: 50,
    },
    {
      key: 'workspace_type',
      label: 'Where do you work?',
      description: 'Your workspace affects rent and deduction eligibility.',
      type: 'select',
      options: [
        { value: 'chair_rental', label: 'Salon chair / room rental' },
        { value: 'own_salon', label: 'My own salon / studio' },
        { value: 'home', label: 'Home-based' },
        { value: 'mobile', label: 'Mobile / at client locations' },
      ],
      defaultValue: 'chair_rental',
    },
    {
      key: 'workspace_rent',
      label: 'Monthly workspace cost',
      description: 'Chair rental, studio lease, or home office portion. $0 if mobile.',
      type: 'currency',
      placeholder: '400',
      defaultValue: 400,
      min: 0,
    },
    {
      key: 'monthly_supplies',
      label: 'Monthly product & supply cost',
      description: 'Hair products, nail supplies, lash extensions, oils, disposables, etc.',
      type: 'currency',
      placeholder: '200',
      defaultValue: 200,
      min: 0,
    },
  ],
  computeFinancials: (a) => {
    const price = Number(a.price_per_service) || 60;
    const clients = Number(a.clients_per_week) || 20;
    const monthlyRevenue = price * clients * 4.33;
    const workspaceType = String(a.workspace_type) || 'chair_rental';

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        supplies: Number(a.monthly_supplies) || 200,
        rent: workspaceType === 'mobile' ? 0 : (Number(a.workspace_rent) || 400),
        insurance: 55,
        tools: 40,
        marketing: 40,
        home_office: workspaceType === 'home' ? 150 : 0,
      },
    };
  },
};

// ── C10: Fitness & wellness ───────────────────────────────────────────────
const C10_QUESTIONS: ClusterQuestionSet = {
  title: 'Fitness & Wellness Business',
  description: 'Tell us about your sessions and pricing so we can estimate your finances.',
  questions: [
    {
      key: 'fee_per_session',
      label: 'Price per session / class',
      description: 'How much do you charge per session, class, or appointment?',
      type: 'currency',
      placeholder: '60',
      defaultValue: 60,
      min: 10,
    },
    {
      key: 'sessions_per_week',
      label: 'Sessions per week',
      description: 'How many sessions or classes do you expect to run each week?',
      type: 'number',
      placeholder: '15',
      defaultValue: 15,
      min: 1,
    },
    {
      key: 'rents_studio',
      label: 'Do you rent a studio or gym space?',
      description: 'Monthly studio or space rental.',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'studio_rent',
      label: 'Monthly studio rent',
      description: 'How much do you pay per month for your space?',
      type: 'currency',
      placeholder: '800',
      defaultValue: 800,
      min: 0,
    },
    {
      key: 'has_equipment',
      label: 'Do you need to buy equipment?',
      description: 'Weights, mats, props, machines — amortized monthly.',
      type: 'boolean',
      defaultValue: true,
    },
  ],
  computeFinancials: (a) => {
    const fee = Number(a.fee_per_session) || 60;
    const sessions = Number(a.sessions_per_week) || 15;
    const monthlyRevenue = fee * sessions * 4.33;
    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        rent: a.rents_studio ? (Number(a.studio_rent) || 800) : 0,
        equipment: a.has_equipment ? 150 : 0,
        insurance: 80,
        marketing: 60,
        phone: 45,
      },
    };
  },
};

// ── C11: Creative & media ────────────────────────────────────────────────
const C11_QUESTIONS: ClusterQuestionSet = {
  title: 'Creative & Media Business',
  description: 'Tell us about your projects and pricing so we can estimate your finances.',
  questions: [
    {
      key: 'avg_project_fee',
      label: 'Average fee per project',
      description: 'How much do you charge per project or gig?',
      type: 'currency',
      placeholder: '1500',
      defaultValue: 1500,
      min: 50,
    },
    {
      key: 'projects_per_month',
      label: 'Projects per month',
      description: 'How many projects or gigs do you expect to complete each month?',
      type: 'number',
      placeholder: '3',
      defaultValue: 3,
      min: 1,
    },
    {
      key: 'has_equipment_costs',
      label: 'Do you have significant equipment costs?',
      description: 'Camera, computer, software, instruments — amortized monthly.',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'has_studio',
      label: 'Do you rent a workspace or studio?',
      description: 'Monthly rent for your creative space.',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  computeFinancials: (a) => {
    const fee = Number(a.avg_project_fee) || 1500;
    const projects = Number(a.projects_per_month) || 3;
    const monthlyRevenue = fee * projects;
    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        equipment: a.has_equipment_costs ? 200 : 0,
        software: 80,
        rent: a.has_studio ? 600 : 0,
        marketing: 50,
        phone: 45,
      },
    };
  },
};

// ── C12: Education & tutoring ────────────────────────────────────────────
const C12_QUESTIONS: ClusterQuestionSet = {
  title: 'Education & Tutoring Business',
  description: 'Tell us about your students and pricing so we can estimate your finances.',
  questions: [
    {
      key: 'fee_per_session',
      label: 'Price per session or class',
      description: 'How much do you charge per lesson, class, or workshop?',
      type: 'currency',
      placeholder: '50',
      defaultValue: 50,
      min: 10,
    },
    {
      key: 'sessions_per_week',
      label: 'Sessions per week',
      description: 'How many sessions or classes do you expect to deliver each week?',
      type: 'number',
      placeholder: '12',
      defaultValue: 12,
      min: 1,
    },
    {
      key: 'sells_courses',
      label: 'Do you sell online courses or materials?',
      description: 'Pre-recorded courses, ebooks, workbooks, etc.',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'monthly_course_revenue',
      label: 'Monthly passive income from courses',
      description: 'Revenue from pre-recorded or digital products.',
      type: 'currency',
      placeholder: '300',
      defaultValue: 300,
      min: 0,
    },
  ],
  computeFinancials: (a) => {
    const fee = Number(a.fee_per_session) || 50;
    const sessions = Number(a.sessions_per_week) || 12;
    const sessionRevenue = fee * sessions * 4.33;
    const courseRevenue = a.sells_courses ? (Number(a.monthly_course_revenue) || 300) : 0;
    const monthlyRevenue = sessionRevenue + courseRevenue;
    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      expenseOverrides: {
        materials: 60,
        software: a.sells_courses ? 50 : 20,
        marketing: 40,
        phone: 45,
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
  C10: C10_QUESTIONS,
  C11: C11_QUESTIONS,
  C12: C12_QUESTIONS,
};

/**
 * Get the cluster-specific question set for a given cluster ID.
 */
export function getClusterQuestions(clusterId: ClusterID): ClusterQuestionSet {
  return CLUSTER_QUESTIONS[clusterId] ?? CLUSTER_QUESTIONS.C2;  // fallback to freelance (lowest friction)
}
