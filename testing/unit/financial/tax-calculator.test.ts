import { describe, expect, it } from 'vitest';
import { calculateTaxSnapshot } from '../../../src/lib/financial/tax-calculator';

describe('calculateTaxSnapshot', () => {
  it('returns zero sales tax under the GST/QST threshold', () => {
    const result = calculateTaxSnapshot({
      gross_monthly_revenue: 1000,
      monthly_expenses: 380,
      business_structure: 'sole_proprietorship',
    });

    expect(result.annual_revenue).toBe(12000);
    expect(result.gst_collected).toBe(0);
    expect(result.qst_collected).toBe(0);
    expect(result.gst_qst_remittance).toBe(0);
    expect(result.net_revenue).toBe(7440);
    expect(result.monthly_take_home).toBeGreaterThan(0);
    expect(result.effective_take_home_rate).toBeGreaterThan(0);
  });

  it('collects GST/QST when annual revenue is above threshold', () => {
    const result = calculateTaxSnapshot({
      gross_monthly_revenue: 4000, // 48,000 annual
      monthly_expenses: 1000,
      business_structure: 'sole_proprietorship',
    });

    expect(result.annual_revenue).toBe(48000);
    expect(result.gst_collected).toBe(2400);
    expect(result.qst_collected).toBe(4788);
    expect(result.gst_qst_remittance).toBe(7188);
    expect(result.net_revenue).toBe(36000);
  });

  it('applies progressive tax brackets and contributions for mid-income profile', () => {
    const result = calculateTaxSnapshot({
      gross_monthly_revenue: 5000, // 60,000 annual
      monthly_expenses: 250, // 3,000 annual
      business_structure: 'sole_proprietorship',
    });

    expect(result.annual_revenue).toBe(60000);
    expect(result.net_revenue).toBe(57000);
    expect(result.federal_income_tax).toBeGreaterThan(0);
    expect(result.provincial_income_tax).toBeGreaterThan(0);
    expect(result.qpp_contribution).toBeGreaterThan(0);
    expect(result.qpip_premium).toBeGreaterThan(0);
    expect(result.total_deductions).toBeGreaterThan(0);
    expect(result.monthly_take_home).toBeLessThan(5000);
    expect(result.effective_take_home_rate).toBeGreaterThan(0);
    expect(result.effective_take_home_rate).toBeLessThan(1);
  });

  it('handles zero revenue safely', () => {
    const result = calculateTaxSnapshot({
      gross_monthly_revenue: 0,
      monthly_expenses: 0,
      business_structure: 'sole_proprietorship',
    });

    expect(result.annual_revenue).toBe(0);
    expect(result.net_revenue).toBe(0);
    expect(result.total_deductions).toBe(0);
    expect(result.monthly_take_home).toBe(0);
    expect(result.effective_take_home_rate).toBe(0);
    expect(result.quarterly_installment).toBe(0);
  });

  it('clamps negative inputs to zero', () => {
    const result = calculateTaxSnapshot({
      gross_monthly_revenue: -1000,
      monthly_expenses: -200,
      business_structure: 'sole_proprietorship',
    });

    expect(result.annual_revenue).toBe(0);
    expect(result.net_revenue).toBe(0);
    expect(result.monthly_take_home).toBe(0);
  });
});
