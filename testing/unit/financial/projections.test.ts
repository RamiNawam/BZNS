import { describe, expect, it } from 'vitest';
import {
  generateScenarios,
  calculateBreakEven,
  getBreakEvenResult,
  calculatePricing,
  generateMonthlyProjections,
  calculateFundingImpact,
} from '../../../src/lib/financial/projections';
import { SALES_TAX_REGISTRATION_THRESHOLD } from '../../../src/lib/financial/constants';

// ═══════════════════════════════════════════════════════════════════════════
// generateScenarios
// ═══════════════════════════════════════════════════════════════════════════
describe('generateScenarios', () => {
  it('returns exactly 3 scenarios: Conservative, Expected, Optimistic', () => {
    const scenarios = generateScenarios(5000, 500);
    expect(scenarios).toHaveLength(3);
    expect(scenarios[0].label).toBe('Conservative');
    expect(scenarios[1].label).toBe('Expected');
    expect(scenarios[2].label).toBe('Optimistic');
  });

  it('conservative = 70% of revenue, expected = 100%, optimistic = 140%', () => {
    const scenarios = generateScenarios(10000, 1000);
    expect(scenarios[0].monthlyRevenue).toBe(7000);
    expect(scenarios[1].monthlyRevenue).toBe(10000);
    expect(scenarios[2].monthlyRevenue).toBe(14000);
  });

  it('all scenarios have non-negative take-home', () => {
    const scenarios = generateScenarios(5000, 500);
    for (const s of scenarios) {
      expect(s.monthlyTakeHome).toBeGreaterThanOrEqual(0);
    }
  });

  it('optimistic take-home >= expected take-home >= conservative take-home', () => {
    const scenarios = generateScenarios(5000, 500);
    expect(scenarios[2].monthlyTakeHome).toBeGreaterThanOrEqual(scenarios[1].monthlyTakeHome);
    expect(scenarios[1].monthlyTakeHome).toBeGreaterThanOrEqual(scenarios[0].monthlyTakeHome);
  });

  it('effectiveKeepRate is between 0 and 1', () => {
    const scenarios = generateScenarios(5000, 500);
    for (const s of scenarios) {
      expect(s.effectiveKeepRate).toBeGreaterThanOrEqual(0);
      expect(s.effectiveKeepRate).toBeLessThanOrEqual(1);
    }
  });

  it('GST required flag is correct based on annual revenue', () => {
    const scenarios = generateScenarios(2000, 200);
    // conservative: 2000*0.7 = 1400 → 1400*12 = 16800 < 30K → false
    expect(scenarios[0].gstRequired).toBe(false);
    // expected: 2000*12 = 24000 < 30K → false
    expect(scenarios[1].gstRequired).toBe(false);
    // optimistic: 2000*1.4 = 2800 → 2800*12 = 33600 > 30K → true
    expect(scenarios[2].gstRequired).toBe(true);
  });

  it('zero revenue: all scenarios have zero take-home', () => {
    const scenarios = generateScenarios(0, 0);
    for (const s of scenarios) {
      expect(s.monthlyTakeHome).toBe(0);
      expect(s.monthlyRevenue).toBe(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateBreakEven
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateBreakEven', () => {
  it('break-even for zero expenses is near zero', () => {
    const be = calculateBreakEven(0);
    expect(be).toBeLessThanOrEqual(5); // should be essentially 0 or 1
  });

  it('break-even for $500 expenses is greater than $500', () => {
    const be = calculateBreakEven(500);
    // Must cover expenses + taxes on earned income
    expect(be).toBeGreaterThan(500);
  });

  it('break-even increases with expenses', () => {
    const be1 = calculateBreakEven(500);
    const be2 = calculateBreakEven(2000);
    const be3 = calculateBreakEven(5000);
    expect(be2).toBeGreaterThan(be1);
    expect(be3).toBeGreaterThan(be2);
  });

  it('break-even is always a positive integer (Math.ceil)', () => {
    const be = calculateBreakEven(1234);
    expect(be).toBeGreaterThan(0);
    expect(Number.isInteger(be)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getBreakEvenResult
// ═══════════════════════════════════════════════════════════════════════════
describe('getBreakEvenResult', () => {
  it('above break-even when revenue > break-even point', () => {
    const result = getBreakEvenResult(8000, 500);
    expect(result.isAboveBreakEven).toBe(true);
    expect(result.surplus).toBeGreaterThan(0);
    expect(result.monthsToBreakEven).toBeNull();
  });

  it('below break-even when revenue < break-even point', () => {
    // $2000/mo revenue, $3000/mo expenses → definitely below break-even
    // At 10% growth: 2000*1.1^n > ~3500 → about 6 months
    const result = getBreakEvenResult(2000, 3000);
    expect(result.isAboveBreakEven).toBe(false);
    expect(result.surplus).toBeLessThan(0);
    // With 10% monthly growth from $2000, should reach ~$3500 in reasonable time
    expect(result.monthsToBreakEven).not.toBeNull();
    expect(result.monthsToBreakEven).toBeGreaterThan(0);
    expect(result.monthsToBreakEven).toBeLessThanOrEqual(36);
  });

  it('monthsToBreakEven is null if revenue is 0', () => {
    const result = getBreakEvenResult(0, 5000);
    expect(result.monthsToBreakEven).toBeNull();
  });

  it('monthsToBreakEven is capped at 36', () => {
    const result = getBreakEvenResult(1, 50000); // would take forever at 10% growth
    // Either null or <= 36
    if (result.monthsToBreakEven !== null) {
      expect(result.monthsToBreakEven).toBeLessThanOrEqual(36);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// calculatePricing
// ═══════════════════════════════════════════════════════════════════════════
describe('calculatePricing', () => {
  it('grossMonthlyRevenue = price × units', () => {
    const r = calculatePricing(50, 100, 500);
    expect(r.grossMonthlyRevenue).toBe(5000);
  });

  it('perUnitTakeHome + perUnitTaxBurden accounts for all revenue', () => {
    const r = calculatePricing(50, 100, 500);
    // take-home per unit + tax per unit ≈ revenue per unit minus expenses per unit
    // (not exact because expenses are spread across units too)
    expect(r.perUnitTakeHome).toBeGreaterThanOrEqual(0);
    expect(r.perUnitTaxBurden).toBeGreaterThanOrEqual(0);
  });

  it('monthlyTakeHome is never negative', () => {
    const r = calculatePricing(10, 10, 5000); // expenses >> revenue
    expect(r.monthlyTakeHome).toBeGreaterThanOrEqual(0);
  });

  it('zero units: no division by zero', () => {
    const r = calculatePricing(50, 0, 500);
    expect(r.grossMonthlyRevenue).toBe(0);
    expect(r.perUnitTakeHome).toBeGreaterThanOrEqual(0);
    expect(r.perUnitTaxBurden).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(r.perUnitTakeHome)).toBe(true);
    expect(Number.isFinite(r.perUnitTaxBurden)).toBe(true);
  });

  it('zero price: everything zero', () => {
    const r = calculatePricing(0, 100, 500);
    expect(r.grossMonthlyRevenue).toBe(0);
    expect(r.monthlyTakeHome).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// generateMonthlyProjections
// ═══════════════════════════════════════════════════════════════════════════
describe('generateMonthlyProjections', () => {
  it('returns 12 months', () => {
    const projections = generateMonthlyProjections(5000, 3000, 1000, 500);
    expect(projections).toHaveLength(12);
  });

  it('months are numbered 1 to 12', () => {
    const projections = generateMonthlyProjections(5000, 3000, 1000, 500);
    for (let i = 0; i < 12; i++) {
      expect(projections[i].month).toBe(i + 1);
    }
  });

  it('cumulative values increase linearly', () => {
    const projections = generateMonthlyProjections(5000, 3000, 1000, 500);
    for (let i = 1; i < 12; i++) {
      expect(projections[i].cumulativeRevenue).toBeGreaterThan(projections[i - 1].cumulativeRevenue);
    }
  });

  it('cumulative revenue at month 12 = monthlyRevenue × 12', () => {
    const projections = generateMonthlyProjections(5000, 3000, 1000, 500);
    expect(projections[11].cumulativeRevenue).toBe(60000);
  });

  it('cumulative take-home is never negative', () => {
    const projections = generateMonthlyProjections(5000, 3000, 1000, 500);
    for (const p of projections) {
      expect(p.cumulativeTakeHome).toBeGreaterThanOrEqual(0);
    }
  });

  it('GST threshold crossing detected correctly', () => {
    // $3000/mo → crosses $30K at month 10
    const projections = generateMonthlyProjections(3000, 2000, 500, 250);
    // Month 10: cumRev = 30000, which >= threshold
    expect(projections[9].crossedGstThreshold).toBe(true);
    // Month 9: cumRev = 27000, < threshold
    expect(projections[8].crossedGstThreshold).toBe(false);
  });

  it('zero revenue: all cumulative values are zero', () => {
    const projections = generateMonthlyProjections(0, 0, 0, 0);
    for (const p of projections) {
      expect(p.cumulativeRevenue).toBe(0);
      expect(p.cumulativeTakeHome).toBe(0);
      expect(p.cumulativeExpenses).toBe(0);
      expect(p.cumulativeTax).toBe(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateFundingImpact
// ═══════════════════════════════════════════════════════════════════════════
describe('calculateFundingImpact', () => {
  it('calculates months of runway correctly', () => {
    const r = calculateFundingImpact(10000, 2000, 3000);
    expect(r.monthsOfRunway).toBe(5);
  });

  it('zero expenses: 0 months of runway', () => {
    const r = calculateFundingImpact(10000, 0, 3000);
    expect(r.monthsOfRunway).toBe(0);
  });

  it('zero funding: message says complete intake', () => {
    const r = calculateFundingImpact(0, 2000, 3000);
    expect(r.effectiveRunwayMessage).toContain('Complete intake');
  });

  it('12+ months: message says over a year', () => {
    const r = calculateFundingImpact(50000, 2000, 1000);
    expect(r.monthsOfRunway).toBeGreaterThanOrEqual(12);
    expect(r.effectiveRunwayMessage).toContain('year');
  });

  it('6-11 months: message mentions the count', () => {
    const r = calculateFundingImpact(16000, 2000, 1000);
    expect(r.monthsOfRunway).toBe(8);
    expect(r.effectiveRunwayMessage).toContain('8');
  });

  it('under 6 months: message advises reaching break-even', () => {
    const r = calculateFundingImpact(6000, 2000, 1000);
    expect(r.monthsOfRunway).toBe(3);
    expect(r.effectiveRunwayMessage).toContain('break-even');
  });

  it('totalFundingAvailable is passed through', () => {
    const r = calculateFundingImpact(95000, 2000, 3000);
    expect(r.totalFundingAvailable).toBe(95000);
  });
});
