import { describe, expect, it } from 'vitest';
import { CLUSTER_QUESTIONS, getClusterQuestions } from '../../../src/lib/financial/cluster-questions';
import type { ClusterID } from '../../../src/lib/clusters';

const ALL_CLUSTERS: ClusterID[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURE VALIDATION — every cluster has a valid question set
// ═══════════════════════════════════════════════════════════════════════════
describe('Cluster question sets — structure', () => {
  for (const cid of ALL_CLUSTERS) {
    describe(`${cid}`, () => {
      const qs = CLUSTER_QUESTIONS[cid];

      it('has a title and description', () => {
        expect(qs.title).toBeTruthy();
        expect(qs.description).toBeTruthy();
      });

      it('has at least 3 questions', () => {
        expect(qs.questions.length).toBeGreaterThanOrEqual(3);
      });

      it('every question has required fields', () => {
        for (const q of qs.questions) {
          expect(q.key).toBeTruthy();
          expect(q.label).toBeTruthy();
          expect(q.description).toBeTruthy();
          expect(['currency', 'number', 'select', 'boolean']).toContain(q.type);
        }
      });

      it('question keys are unique within the cluster', () => {
        const keys = qs.questions.map(q => q.key);
        expect(new Set(keys).size).toBe(keys.length);
      });

      it('select questions have options', () => {
        for (const q of qs.questions) {
          if (q.type === 'select') {
            expect(q.options).toBeDefined();
            expect(q.options!.length).toBeGreaterThan(0);
          }
        }
      });

      it('computeFinancials is a function', () => {
        expect(typeof qs.computeFinancials).toBe('function');
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// computeFinancials — DEFAULT VALUES produce positive revenue, no negatives
// ═══════════════════════════════════════════════════════════════════════════
describe('computeFinancials — defaults produce valid output', () => {
  for (const cid of ALL_CLUSTERS) {
    it(`${cid}: default answers → positive revenue, non-negative expenses`, () => {
      const qs = CLUSTER_QUESTIONS[cid];
      // Build answers from defaults
      const answers: Record<string, number | string | boolean> = {};
      for (const q of qs.questions) {
        if (q.defaultValue !== undefined) {
          answers[q.key] = q.defaultValue;
        }
      }

      const result = qs.computeFinancials(answers);
      expect(result.monthlyRevenue).toBeGreaterThan(0);
      expect(Number.isFinite(result.monthlyRevenue)).toBe(true);

      // All expense overrides must be >= 0
      for (const [key, val] of Object.entries(result.expenseOverrides)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(val)).toBe(true);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// computeFinancials — EMPTY / ZERO answers should not crash or go negative
// ═══════════════════════════════════════════════════════════════════════════
describe('computeFinancials — empty answers fallback to defaults', () => {
  for (const cid of ALL_CLUSTERS) {
    it(`${cid}: empty object → still produces valid output`, () => {
      const qs = CLUSTER_QUESTIONS[cid];
      const result = qs.computeFinancials({});
      expect(result.monthlyRevenue).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.monthlyRevenue)).toBe(true);

      for (const val of Object.values(result.expenseOverrides)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(val)).toBe(true);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// C1: HOME-BASED FOOD — specific computations
// ═══════════════════════════════════════════════════════════════════════════
describe('C1 — Home-based food computeFinancials', () => {
  const compute = CLUSTER_QUESTIONS.C1.computeFinancials;

  it('revenue = price × items/week × 4.33', () => {
    const r = compute({ price_per_item: 10, items_per_week: 50, ingredient_cost_pct: 30, sells_at_market: false, does_delivery: false });
    expect(r.monthlyRevenue).toBe(Math.round(10 * 50 * 4.33));
  });

  it('ingredient cost is percentage-based', () => {
    const r = compute({ price_per_item: 10, items_per_week: 50, ingredient_cost_pct: 40, sells_at_market: false, does_delivery: false });
    const expectedIngredients = Math.round(0.40 * r.monthlyRevenue);
    expect(r.expenseOverrides.ingredients).toBe(expectedIngredients);
  });

  it('market fees = 0 when not selling at market', () => {
    const r = compute({ price_per_item: 10, items_per_week: 50, ingredient_cost_pct: 30, sells_at_market: false, does_delivery: false });
    expect(r.expenseOverrides.market_fees).toBe(0);
  });

  it('market fees > 0 when selling at market', () => {
    const r = compute({ price_per_item: 10, items_per_week: 50, ingredient_cost_pct: 30, sells_at_market: true, does_delivery: false });
    expect(r.expenseOverrides.market_fees).toBeGreaterThan(0);
  });

  it('delivery = 0 when no delivery', () => {
    const r = compute({ price_per_item: 10, items_per_week: 50, ingredient_cost_pct: 30, sells_at_market: false, does_delivery: false });
    expect(r.expenseOverrides.delivery).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C2: FREELANCE — rate type logic
// ═══════════════════════════════════════════════════════════════════════════
describe('C2 — Freelance computeFinancials', () => {
  const compute = CLUSTER_QUESTIONS.C2.computeFinancials;

  it('hourly: revenue = rate × hours × 4.33', () => {
    const r = compute({ rate_type: 'hourly', rate_amount: 100, billable_hours_week: 20, works_from_home: true, software_cost: 100 });
    expect(r.monthlyRevenue).toBe(Math.round(100 * 20 * 4.33));
  });

  it('daily: revenue = rate × (hours/8) × 4.33', () => {
    const r = compute({ rate_type: 'daily', rate_amount: 500, billable_hours_week: 40, works_from_home: false, software_cost: 0 });
    expect(r.monthlyRevenue).toBe(Math.round(500 * 5 * 4.33));
  });

  it('project: revenue = rate × 2 (assumed 2/mo)', () => {
    const r = compute({ rate_type: 'project', rate_amount: 3000, billable_hours_week: 25, works_from_home: false, software_cost: 0 });
    expect(r.monthlyRevenue).toBe(6000);
  });

  it('monthly retainer: revenue = rate directly', () => {
    const r = compute({ rate_type: 'monthly', rate_amount: 5000, billable_hours_week: 25, works_from_home: false, software_cost: 0 });
    expect(r.monthlyRevenue).toBe(5000);
  });

  it('home office expense = 200 when working from home', () => {
    const r = compute({ rate_type: 'hourly', rate_amount: 50, billable_hours_week: 20, works_from_home: true, software_cost: 50 });
    expect(r.expenseOverrides.home_office).toBe(200);
  });

  it('home office expense = 0 when NOT working from home', () => {
    const r = compute({ rate_type: 'hourly', rate_amount: 50, billable_hours_week: 20, works_from_home: false, software_cost: 50 });
    expect(r.expenseOverrides.home_office).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C5: ONLINE RETAIL — platform fees
// ═══════════════════════════════════════════════════════════════════════════
describe('C5 — Online retail computeFinancials', () => {
  const compute = CLUSTER_QUESTIONS.C5.computeFinancials;

  it('revenue = price × units', () => {
    const r = compute({ avg_product_price: 25, units_per_month: 100, cost_per_unit: 10, platform: 'shopify', ships_products: true, monthly_ad_spend: 50 });
    expect(r.monthlyRevenue).toBe(2500);
  });

  it('inventory = cost × units', () => {
    const r = compute({ avg_product_price: 25, units_per_month: 100, cost_per_unit: 10, platform: 'shopify', ships_products: true, monthly_ad_spend: 50 });
    expect(r.expenseOverrides.inventory).toBe(1000);
  });

  it('no shipping cost when ships_products is false', () => {
    const r = compute({ avg_product_price: 25, units_per_month: 100, cost_per_unit: 10, platform: 'shopify', ships_products: false, monthly_ad_spend: 50 });
    expect(r.expenseOverrides.shipping).toBe(0);
  });

  it('shipping cost based on units when ships_products is true', () => {
    const r = compute({ avg_product_price: 25, units_per_month: 100, cost_per_unit: 10, platform: 'shopify', ships_products: true, monthly_ad_spend: 50 });
    expect(r.expenseOverrides.shipping).toBe(1000); // 100 × $10
  });

  it('different platform fees for each platform', () => {
    const platforms = ['shopify', 'etsy', 'amazon', 'own_site', 'social'];
    const fees = platforms.map(p => {
      const r = compute({ avg_product_price: 30, units_per_month: 50, cost_per_unit: 10, platform: p, ships_products: false, monthly_ad_spend: 0 });
      return r.expenseOverrides.platform_fees;
    });
    // Amazon should have the highest fees (15% referral)
    const amazonFee = fees[2];
    expect(amazonFee).toBeGreaterThan(fees[3]); // more than own_site
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C6: PHYSICAL RETAIL — rent-related
// ═══════════════════════════════════════════════════════════════════════════
describe('C6 — Physical retail computeFinancials', () => {
  const compute = CLUSTER_QUESTIONS.C6.computeFinancials;

  it('includes rent in expenses', () => {
    const r = compute({ avg_product_price: 40, units_per_month: 100, cost_per_unit: 20, monthly_rent: 2000, has_pos_system: true, also_sells_online: false });
    expect(r.expenseOverrides.rent).toBe(2000);
  });

  it('POS system fee when enabled', () => {
    const r = compute({ avg_product_price: 40, units_per_month: 100, cost_per_unit: 20, monthly_rent: 1000, has_pos_system: true, also_sells_online: false });
    expect(r.expenseOverrides.pos_system).toBe(50);
  });

  it('no POS fee when disabled', () => {
    const r = compute({ avg_product_price: 40, units_per_month: 100, cost_per_unit: 20, monthly_rent: 1000, has_pos_system: false, also_sells_online: false });
    expect(r.expenseOverrides.pos_system).toBe(0);
  });

  it('online platform fee when also selling online', () => {
    const r = compute({ avg_product_price: 40, units_per_month: 100, cost_per_unit: 20, monthly_rent: 1000, has_pos_system: false, also_sells_online: true });
    expect(r.expenseOverrides.online_platform).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C7: RESTAURANT — food cost percentage
// ═══════════════════════════════════════════════════════════════════════════
describe('C7 — Restaurant computeFinancials', () => {
  const compute = CLUSTER_QUESTIONS.C7.computeFinancials;

  it('ingredients = food_cost_pct% of revenue', () => {
    const r = compute({ expected_monthly_revenue: 10000, monthly_rent: 1500, food_cost_pct: 30, num_seats: 25, serves_alcohol: false });
    expect(r.expenseOverrides.ingredients).toBe(3000);
  });

  it('alcohol permit adds to costs', () => {
    const noAlc = compute({ expected_monthly_revenue: 10000, monthly_rent: 1500, food_cost_pct: 30, num_seats: 25, serves_alcohol: false });
    const withAlc = compute({ expected_monthly_revenue: 10000, monthly_rent: 1500, food_cost_pct: 30, num_seats: 25, serves_alcohol: true });
    expect(withAlc.expenseOverrides.permits).toBeGreaterThan(noAlc.expenseOverrides.permits);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C8: CONSTRUCTION — vehicle costs
// ═══════════════════════════════════════════════════════════════════════════
describe('C8 — Construction computeFinancials', () => {
  const compute = CLUSTER_QUESTIONS.C8.computeFinancials;

  it('revenue = job value × jobs/month', () => {
    const r = compute({ avg_job_value: 5000, jobs_per_month: 4, material_cost_pct: 30, has_vehicle: true, vehicle_monthly: 400 });
    expect(r.monthlyRevenue).toBe(20000);
  });

  it('materials = percentage of revenue', () => {
    const r = compute({ avg_job_value: 5000, jobs_per_month: 4, material_cost_pct: 40, has_vehicle: false, vehicle_monthly: 0 });
    expect(r.expenseOverrides.materials).toBe(8000);
  });

  it('vehicle cost = 0 when no vehicle', () => {
    const r = compute({ avg_job_value: 5000, jobs_per_month: 4, material_cost_pct: 30, has_vehicle: false, vehicle_monthly: 400 });
    expect(r.expenseOverrides.vehicle).toBe(0);
  });

  it('vehicle cost = specified amount when has vehicle', () => {
    const r = compute({ avg_job_value: 5000, jobs_per_month: 4, material_cost_pct: 30, has_vehicle: true, vehicle_monthly: 500 });
    expect(r.expenseOverrides.vehicle).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C9: PERSONAL CARE — workspace types
// ═══════════════════════════════════════════════════════════════════════════
describe('C9 — Personal care computeFinancials', () => {
  const compute = CLUSTER_QUESTIONS.C9.computeFinancials;

  it('revenue = price × clients/week × 4.33', () => {
    const r = compute({ price_per_service: 80, clients_per_week: 25, workspace_type: 'chair_rental', workspace_rent: 500, monthly_supplies: 300 });
    expect(r.monthlyRevenue).toBe(Math.round(80 * 25 * 4.33));
  });

  it('rent = 0 for mobile workers', () => {
    const r = compute({ price_per_service: 80, clients_per_week: 25, workspace_type: 'mobile', workspace_rent: 500, monthly_supplies: 300 });
    expect(r.expenseOverrides.rent).toBe(0);
  });

  it('home_office added for home-based', () => {
    const r = compute({ price_per_service: 80, clients_per_week: 25, workspace_type: 'home', workspace_rent: 200, monthly_supplies: 300 });
    expect(r.expenseOverrides.home_office).toBe(150);
  });

  it('no home_office for chair_rental', () => {
    const r = compute({ price_per_service: 80, clients_per_week: 25, workspace_type: 'chair_rental', workspace_rent: 500, monthly_supplies: 300 });
    expect(r.expenseOverrides.home_office).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getClusterQuestions fallback
// ═══════════════════════════════════════════════════════════════════════════
describe('getClusterQuestions', () => {
  it('returns correct set for each cluster', () => {
    for (const cid of ALL_CLUSTERS) {
      const qs = getClusterQuestions(cid);
      expect(qs).toBe(CLUSTER_QUESTIONS[cid]);
    }
  });

  it('falls back to C2 for unknown cluster', () => {
    const qs = getClusterQuestions('C99' as ClusterID);
    expect(qs).toBe(CLUSTER_QUESTIONS.C2);
  });
});
