import { describe, expect, it } from 'vitest';
import { calculateTaxSnapshot, calculateTakeHome } from '../../../src/lib/financial/tax-calculator';
import {
  FEDERAL_BASIC_PERSONAL_AMOUNT,
  QUEBEC_BASIC_PERSONAL_AMOUNT,
  SALES_TAX_REGISTRATION_THRESHOLD,
  QPP_BASIC_EXEMPTION,
  QPP_MAX_PENSIONABLE_EARNINGS,
  QPP_SELF_EMPLOYED_RATE,
  QPIP_SELF_EMPLOYED_RATE,
  QPIP_MAX_INSURABLE_EARNINGS,
  GST_RATE,
  QST_RATE,
  QUARTERLY_INSTALLMENT_THRESHOLD,
} from '../../../src/lib/financial/constants';

// ─── Helper: all results should never have negative values ──────────────────
function assertNoNegatives(result: ReturnType<typeof calculateTaxSnapshot>) {
  expect(result.annual_revenue).toBeGreaterThanOrEqual(0);
  expect(result.net_revenue).toBeGreaterThanOrEqual(0);
  expect(result.gst_collected).toBeGreaterThanOrEqual(0);
  expect(result.qst_collected).toBeGreaterThanOrEqual(0);
  expect(result.gst_qst_remittance).toBeGreaterThanOrEqual(0);
  expect(result.federal_income_tax).toBeGreaterThanOrEqual(0);
  expect(result.provincial_income_tax).toBeGreaterThanOrEqual(0);
  expect(result.qpp_contribution).toBeGreaterThanOrEqual(0);
  expect(result.qpip_premium).toBeGreaterThanOrEqual(0);
  expect(result.total_deductions).toBeGreaterThanOrEqual(0);
  expect(result.monthly_take_home).toBeGreaterThanOrEqual(0);
  expect(result.quarterly_installment).toBeGreaterThanOrEqual(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// ZERO & NEGATIVE EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — zero & negative edge cases', () => {
  it('returns all zeros for zero revenue and zero expenses', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 0,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.annual_revenue).toBe(0);
    expect(r.net_revenue).toBe(0);
    expect(r.total_deductions).toBe(0);
    expect(r.monthly_take_home).toBe(0);
    expect(r.effective_take_home_rate).toBe(0);
    expect(r.quarterly_installment).toBe(0);
    assertNoNegatives(r);
  });

  it('clamps negative revenue to zero — no negative taxes', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: -5000,
      monthly_expenses: 200,
      business_structure: 'sole_proprietorship',
    });
    expect(r.annual_revenue).toBe(0);
    expect(r.net_revenue).toBe(0);
    expect(r.monthly_take_home).toBe(0);
    assertNoNegatives(r);
  });

  it('clamps negative expenses to zero', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 3000,
      monthly_expenses: -500,
      business_structure: 'sole_proprietorship',
    });
    expect(r.net_revenue).toBe(36000);
    assertNoNegatives(r);
  });

  it('clamps both negative revenue and expenses to zero', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: -1000,
      monthly_expenses: -200,
      business_structure: 'sole_proprietorship',
    });
    expect(r.annual_revenue).toBe(0);
    expect(r.net_revenue).toBe(0);
    expect(r.monthly_take_home).toBe(0);
    assertNoNegatives(r);
  });

  it('expenses exceeding revenue — net revenue floored at 0, take-home >= 0', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 500,
      monthly_expenses: 2000,
      business_structure: 'sole_proprietorship',
    });
    expect(r.annual_revenue).toBe(6000);
    expect(r.net_revenue).toBe(0);
    expect(r.federal_income_tax).toBe(0);
    expect(r.provincial_income_tax).toBe(0);
    expect(r.qpp_contribution).toBe(0);
    expect(r.qpip_premium).toBe(0);
    expect(r.total_deductions).toBe(0);
    expect(r.monthly_take_home).toBe(0);
    assertNoNegatives(r);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GST/QST THRESHOLD
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — GST/QST threshold', () => {
  it('no sales tax when annual revenue is exactly $30,000', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 2500,
      monthly_expenses: 500,
      business_structure: 'sole_proprietorship',
    });
    expect(r.annual_revenue).toBe(30000);
    expect(r.gst_collected).toBe(0);
    expect(r.qst_collected).toBe(0);
    expect(r.gst_qst_remittance).toBe(0);
  });

  it('no sales tax at $29,999 annual', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 29999 / 12,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.gst_collected).toBe(0);
    expect(r.qst_collected).toBe(0);
  });

  it('charges sales tax at $30,001 annual', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 30001 / 12,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.gst_collected).toBeGreaterThan(0);
    expect(r.qst_collected).toBeGreaterThan(0);
    expect(r.gst_qst_remittance).toBeCloseTo(r.gst_collected + r.qst_collected, 2);
  });

  it('GST = 5% and QST = 9.975% of revenue above threshold', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 4000,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.gst_collected).toBeCloseTo(48000 * GST_RATE, 2);
    expect(r.qst_collected).toBeCloseTo(48000 * QST_RATE, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INCOME BELOW PERSONAL AMOUNTS (NO TAX)
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — income below personal amounts', () => {
  it('no federal tax when net income <= federal basic personal amount', () => {
    const monthlyRev = (FEDERAL_BASIC_PERSONAL_AMOUNT - 100) / 12;
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.federal_income_tax).toBe(0);
  });

  it('no Quebec tax when net income <= Quebec basic personal amount', () => {
    const monthlyRev = (QUEBEC_BASIC_PERSONAL_AMOUNT - 100) / 12;
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.provincial_income_tax).toBe(0);
  });

  it('QPP/QPIP apply even when income tax is zero (above QPP exemption)', () => {
    const monthlyRev = (QPP_BASIC_EXEMPTION + 1000) / 12;
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.qpp_contribution).toBeGreaterThan(0);
    expect(r.qpip_premium).toBeGreaterThan(0);
    expect(r.federal_income_tax).toBe(0);
    expect(r.provincial_income_tax).toBe(0);
  });

  it('no QPP when net income is below QPP basic exemption', () => {
    const monthlyRev = (QPP_BASIC_EXEMPTION - 100) / 12;
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.qpp_contribution).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// QPP / QPIP CAPS
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — QPP/QPIP caps', () => {
  it('QPP is capped at max pensionable earnings', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 20000,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    const maxQPP = (QPP_MAX_PENSIONABLE_EARNINGS - QPP_BASIC_EXEMPTION) * QPP_SELF_EMPLOYED_RATE;
    expect(r.qpp_contribution).toBeCloseTo(maxQPP, 0);
  });

  it('QPP correct for income exactly at max pensionable', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: QPP_MAX_PENSIONABLE_EARNINGS / 12,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    const expectedQPP = (QPP_MAX_PENSIONABLE_EARNINGS - QPP_BASIC_EXEMPTION) * QPP_SELF_EMPLOYED_RATE;
    expect(r.qpp_contribution).toBeCloseTo(expectedQPP, 0);
  });

  it('QPIP is capped at max insurable earnings', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 20000,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    const maxQPIP = QPIP_MAX_INSURABLE_EARNINGS * QPIP_SELF_EMPLOYED_RATE;
    expect(r.qpip_premium).toBeCloseTo(maxQPIP, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PERSONA SCENARIOS (Yara, Marcus, Fatima)
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — persona scenarios', () => {
  it('Yara (home baker): $2,080/mo revenue, $480 expenses', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 2080,
      monthly_expenses: 480,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBe(24960);
    expect(r.net_revenue).toBe(19200);
    expect(r.gst_collected).toBe(0); // below $30K
    expect(r.monthly_take_home).toBeGreaterThan(500);
    expect(r.monthly_take_home).toBeLessThanOrEqual(2080);
  });

  it('Marcus (freelance dev): $6,500/mo revenue, $420 expenses', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 6500,
      monthly_expenses: 420,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBe(78000);
    expect(r.net_revenue).toBe(72960);
    expect(r.gst_collected).toBeGreaterThan(0); // above $30K
    expect(r.qpp_contribution).toBeGreaterThan(5000);
    expect(r.monthly_take_home).toBeGreaterThan(2000);
    expect(r.monthly_take_home).toBeLessThan(6500);
  });

  it('Fatima (home daycare): $5,200/mo revenue, $385 expenses', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 5200,
      monthly_expenses: 385,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBe(62400);
    expect(r.gst_collected).toBeGreaterThan(0);
    expect(r.monthly_take_home).toBeGreaterThan(0);
    expect(r.monthly_take_home).toBeLessThan(5200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// QUARTERLY INSTALLMENTS
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — quarterly installments', () => {
  it('no installments when total deductions < $3,000', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 1000,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    if (r.total_deductions < QUARTERLY_INSTALLMENT_THRESHOLD) {
      expect(r.quarterly_installment).toBe(0);
    }
  });

  it('installments = total_deductions / 4 when above threshold', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 8000,
      monthly_expenses: 500,
      business_structure: 'sole_proprietorship',
    });
    expect(r.total_deductions).toBeGreaterThan(QUARTERLY_INSTALLMENT_THRESHOLD);
    expect(r.quarterly_installment).toBeCloseTo(r.total_deductions / 4, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EFFECTIVE TAKE-HOME RATE
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — effective take-home rate', () => {
  it('rate is between 0 and 1 for any positive revenue', () => {
    for (const monthlyRev of [500, 2000, 5000, 10000, 20000]) {
      const r = calculateTaxSnapshot({
        gross_monthly_revenue: monthlyRev,
        monthly_expenses: monthlyRev * 0.2,
        business_structure: 'sole_proprietorship',
      });
      expect(r.effective_take_home_rate).toBeGreaterThanOrEqual(0);
      expect(r.effective_take_home_rate).toBeLessThanOrEqual(1);
    }
  });

  it('rate = monthly_take_home / gross_monthly_revenue', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 5000,
      monthly_expenses: 500,
      business_structure: 'sole_proprietorship',
    });
    expect(r.effective_take_home_rate).toBeCloseTo(r.monthly_take_home / 5000, 2);
  });

  it('rate = 0 when revenue = 0', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 0,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    expect(r.effective_take_home_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TOTAL DEDUCTIONS CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — total deductions consistency', () => {
  it('total_deductions = federal + provincial + QPP + QPIP', () => {
    for (const monthlyRev of [1000, 3000, 5000, 8000, 15000]) {
      const r = calculateTaxSnapshot({
        gross_monthly_revenue: monthlyRev,
        monthly_expenses: monthlyRev * 0.15,
        business_structure: 'sole_proprietorship',
      });
      const sum = r.federal_income_tax + r.provincial_income_tax + r.qpp_contribution + r.qpip_premium;
      expect(r.total_deductions).toBeCloseTo(sum, 2);
    }
  });

  it('annual_take_home = net_revenue - total_deductions, never negative', () => {
    for (const monthlyRev of [500, 2000, 5000, 10000]) {
      const r = calculateTaxSnapshot({
        gross_monthly_revenue: monthlyRev,
        monthly_expenses: monthlyRev * 0.3,
        business_structure: 'sole_proprietorship',
      });
      const annualTakeHome = r.monthly_take_home * 12;
      const expected = Math.max(0, r.net_revenue - r.total_deductions);
      expect(annualTakeHome).toBeCloseTo(expected, 0);
      expect(annualTakeHome).toBeGreaterThanOrEqual(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CORPORATION PATH
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — corporation path', () => {
  it('corporation returns zero for all personal tax fields', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 10000,
      monthly_expenses: 2000,
      business_structure: 'corporation',
    });
    expect(r.federal_income_tax).toBe(0);
    expect(r.provincial_income_tax).toBe(0);
    expect(r.qpp_contribution).toBe(0);
    expect(r.qpip_premium).toBe(0);
    expect(r.total_deductions).toBe(0);
    expect(r.monthly_take_home).toBeCloseTo(r.net_revenue / 12, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PARTNERSHIP = SOLE PROP
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — partnership', () => {
  it('partnership is treated the same as sole proprietorship', () => {
    const input = { gross_monthly_revenue: 5000, monthly_expenses: 500 };
    const sole = calculateTaxSnapshot({ ...input, business_structure: 'sole_proprietorship' });
    const partner = calculateTaxSnapshot({ ...input, business_structure: 'partnership' });

    expect(sole.federal_income_tax).toBe(partner.federal_income_tax);
    expect(sole.provincial_income_tax).toBe(partner.provincial_income_tax);
    expect(sole.qpp_contribution).toBe(partner.qpp_contribution);
    expect(sole.monthly_take_home).toBe(partner.monthly_take_home);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MISSING / EMPTY BUSINESS STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — missing business structure', () => {
  it('defaults to personal tax path when structure is empty string', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 5000,
      monthly_expenses: 500,
      business_structure: '',
    });
    const sole = calculateTaxSnapshot({
      gross_monthly_revenue: 5000,
      monthly_expenses: 500,
      business_structure: 'sole_proprietorship',
    });
    expect(r.federal_income_tax).toBe(sole.federal_income_tax);
    expect(r.monthly_take_home).toBe(sole.monthly_take_home);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUNDING
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — rounding', () => {
  it('all outputs are rounded to at most 2 decimal places', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 3333.33,
      monthly_expenses: 777.77,
      business_structure: 'sole_proprietorship',
    });
    const fields = [
      r.annual_revenue, r.gst_collected, r.qst_collected, r.gst_qst_remittance,
      r.net_revenue, r.federal_income_tax, r.provincial_income_tax,
      r.qpp_contribution, r.qpip_premium, r.total_deductions,
      r.monthly_take_home, r.effective_take_home_rate, r.quarterly_installment,
    ];
    for (const val of fields) {
      // Multiply by 100 and check it's close to an integer
      const shifted = val * 100;
      expect(Math.abs(shifted - Math.round(shifted))).toBeLessThan(0.01);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HIGH INCOME STRESS TESTS
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — high income scenarios', () => {
  it('$25,000/mo freelancer: all fields positive, no negatives', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 25000,
      monthly_expenses: 3000,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBe(300000);
    expect(r.net_revenue).toBe(264000);
    expect(r.federal_income_tax).toBeGreaterThan(10000);
    expect(r.provincial_income_tax).toBeGreaterThan(10000);
    expect(r.monthly_take_home).toBeGreaterThan(0);
    expect(r.monthly_take_home).toBeLessThan(25000);
  });

  it('$50,000/mo: still produces sane results', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 50000,
      monthly_expenses: 5000,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(0);
    expect(r.monthly_take_home).toBeGreaterThan(50000 * 0.25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VERY LOW INCOME EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — very low income', () => {
  it('$100/mo revenue: no QPP (below exemption), QPIP exists, no income tax', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 100,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBe(1200);
    expect(r.qpp_contribution).toBe(0); // $1200 < $3500 exemption
    expect(r.qpip_premium).toBeGreaterThan(0);
    expect(r.federal_income_tax).toBe(0);
    expect(r.provincial_income_tax).toBe(0);
  });

  it('$1/mo: tiny income still works', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 1,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBe(12);
    expect(r.monthly_take_home).toBeGreaterThan(0);
  });

  it('$0.01/mo: fractional input', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 0.01,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESSIVE TAX BRACKET VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — progressive tax verification', () => {
  it('higher income always results in higher total deductions', () => {
    const results = [2000, 4000, 6000, 8000, 12000, 20000].map(rev =>
      calculateTaxSnapshot({
        gross_monthly_revenue: rev,
        monthly_expenses: 0,
        business_structure: 'sole_proprietorship',
      })
    );
    for (let i = 1; i < results.length; i++) {
      expect(results[i].total_deductions).toBeGreaterThanOrEqual(results[i - 1].total_deductions);
    }
  });

  it('marginal rate increases with income', () => {
    const low = calculateTaxSnapshot({
      gross_monthly_revenue: 3000, monthly_expenses: 0, business_structure: 'sole_proprietorship',
    });
    const high = calculateTaxSnapshot({
      gross_monthly_revenue: 15000, monthly_expenses: 0, business_structure: 'sole_proprietorship',
    });
    const lowRate = low.total_deductions / low.net_revenue;
    const highRate = high.total_deductions / high.net_revenue;
    expect(highRate).toBeGreaterThan(lowRate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateTakeHome CONVENIENCE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTakeHome', () => {
  it('returns same results as calculateTaxSnapshot with annualized inputs', () => {
    const annualRev = 60000;
    const annualExp = 6000;
    const r = calculateTakeHome(annualRev, annualExp);
    const snapshot = calculateTaxSnapshot({
      gross_monthly_revenue: annualRev / 12,
      monthly_expenses: annualExp / 12,
      business_structure: 'sole_proprietorship',
    });

    expect(r.annual_revenue).toBe(snapshot.annual_revenue);
    expect(r.net_revenue).toBe(snapshot.net_revenue);
    expect(r.federal_income_tax).toBe(snapshot.federal_income_tax);
    expect(r.monthly_take_home).toBe(snapshot.monthly_take_home);
  });

  it('camelCase aliases match snake_case fields', () => {
    const r = calculateTakeHome(72000, 12000);
    expect(r.federalTax).toBe(r.federal_income_tax);
    expect(r.quebecTax).toBe(r.provincial_income_tax);
    expect(r.qpp).toBe(r.qpp_contribution);
    expect(r.qpip).toBe(r.qpip_premium);
    expect(r.estimatedTakeHome).toBe(r.monthly_take_home);
    expect(r.totalTax).toBe(r.total_deductions);
    expect(r.netBusinessIncome).toBe(r.net_revenue);
  });

  it('zero annual revenue produces all zeros', () => {
    const r = calculateTakeHome(0, 0);
    expect(r.estimatedTakeHome).toBe(0);
    expect(r.totalTax).toBe(0);
    expect(r.federalTax).toBe(0);
    expect(r.quebecTax).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLUSTER-SPECIFIC FINANCIAL SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — cluster business scenarios', () => {
  it('C1 Home baker: $12/item × 40/week = $2,080/mo, $480 expenses', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 2080,
      monthly_expenses: 480,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBe(24960);
    expect(r.net_revenue).toBe(19200);
    expect(r.monthly_take_home).toBeGreaterThan(500);
  });

  it('C2 Freelance dev: $75/hr × 25hrs/week', () => {
    const monthlyRev = Math.round(75 * 25 * 4.33);
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 420,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.annual_revenue).toBeGreaterThan(90000);
    expect(r.monthly_take_home).toBeGreaterThan(2000);
  });

  it('C3 Daycare: 6 kids × $40/day × 5 days/week', () => {
    const monthlyRev = Math.round(6 * 40 * 5 * 4.33);
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 385,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(1000);
  });

  it('C5 Dropshipper: $35/item × 80 units, $15 COGS', () => {
    const revenue = 35 * 80;
    const expenses = 15 * 80 + 100 + 120; // COGS + ads + platform
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: revenue,
      monthly_expenses: expenses,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(0);
  });

  it('C6 Physical retail: $40/item × 150 units, $1500 rent', () => {
    const revenue = 40 * 150;
    const expenses = 18 * 150 + 1500 + 150 + 50 + 80 + 75;
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: revenue,
      monthly_expenses: expenses,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(0);
  });

  it('C7 Restaurant: $8,000/mo revenue, $2,490 expenses', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 8000,
      monthly_expenses: 2490,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.net_revenue).toBe(66120);
    expect(r.monthly_take_home).toBeGreaterThan(0);
  });

  it('C8 Contractor: $3000/job × 3 jobs/mo, 35% materials', () => {
    const revenue = 3000 * 3;
    const expenses = 9000 * 0.35 + 350 + 120 + 180 + 45;
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: revenue,
      monthly_expenses: expenses,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(0);
  });

  it('C9 Beauty salon: $60/service × 20 clients/week', () => {
    const monthlyRev = Math.round(60 * 20 * 4.33);
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 735,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(1000);
  });

  it('C10 Fitness trainer: $60/session × 15/week', () => {
    const monthlyRev = Math.round(60 * 15 * 4.33);
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 1135,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(0);
  });

  it('C11 Creative: $1500/project × 3/mo', () => {
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: 4500,
      monthly_expenses: 375,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(1000);
  });

  it('C12 Tutor: $50/session × 12/week + $300 courses', () => {
    const monthlyRev = Math.round(50 * 12 * 4.33) + 300;
    const r = calculateTaxSnapshot({
      gross_monthly_revenue: monthlyRev,
      monthly_expenses: 195,
      business_structure: 'sole_proprietorship',
    });
    assertNoNegatives(r);
    expect(r.monthly_take_home).toBeGreaterThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STRESS: NO NEGATIVE VALUES ACROSS WIDE RANGE (152 combinations)
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateTaxSnapshot — no negatives across wide input range', () => {
  const revenues = [0, 1, 50, 200, 500, 1000, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 15000, 20000, 30000, 50000, 100000];
  const expenseRatios = [0, 0.1, 0.3, 0.5, 0.8, 1.0, 1.5, 3.0];

  for (const rev of revenues) {
    for (const ratio of expenseRatios) {
      it(`rev=$${rev}/mo, expenses=${(ratio * 100).toFixed(0)}% → no negatives`, () => {
        const r = calculateTaxSnapshot({
          gross_monthly_revenue: rev,
          monthly_expenses: rev * ratio,
          business_structure: 'sole_proprietorship',
        });
        assertNoNegatives(r);
      });
    }
  }
});
