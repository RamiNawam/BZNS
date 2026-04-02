// ============================================================
// FINANCIAL PROJECTIONS ENGINE
// Pure math — no AI. Scenarios, break-even, pricing calculator,
// funding impact, and monthly projection data.
// ============================================================

import { calculateTaxSnapshot, type TaxCalculatorInput } from './tax-calculator';
import { SALES_TAX_REGISTRATION_THRESHOLD } from './constants';
import type { TaxCalculationResult } from '@/types/financial';

// ── Scenario comparison ───────────────────────────────────────

export interface Scenario {
  label: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  taxes: TaxCalculationResult;
  monthlyTakeHome: number;
  effectiveKeepRate: number; // % of gross that becomes take-home
  annualRevenue: number;
  gstRequired: boolean;
}

/**
 * Generate 3 side-by-side scenarios: conservative (70%), expected (100%), optimistic (140%).
 */
export function generateScenarios(
  expectedMonthlyRevenue: number,
  monthlyExpenses: number,
  businessStructure: string = 'sole_proprietorship',
): Scenario[] {
  const multipliers = [
    { label: 'Conservative', factor: 0.7 },
    { label: 'Expected',     factor: 1.0 },
    { label: 'Optimistic',   factor: 1.4 },
  ];

  return multipliers.map(({ label, factor }) => {
    const rev = Math.round(expectedMonthlyRevenue * factor);
    const taxes = calculateTaxSnapshot({
      gross_monthly_revenue: rev,
      monthly_expenses: monthlyExpenses,
      business_structure: businessStructure,
    });
    const monthlyTakeHome = Math.max(0, taxes.monthly_take_home);
    return {
      label,
      monthlyRevenue: rev,
      monthlyExpenses,
      taxes,
      monthlyTakeHome,
      effectiveKeepRate: rev > 0 ? monthlyTakeHome / rev : 0,
      annualRevenue: rev * 12,
      gstRequired: rev * 12 > SALES_TAX_REGISTRATION_THRESHOLD,
    };
  });
}

// ── Break-even calculator ─────────────────────────────────────

export interface BreakEvenResult {
  breakEvenMonthlyRevenue: number;  // minimum gross revenue to cover expenses + taxes
  currentMonthlyRevenue: number;
  surplus: number;                  // positive = above break-even, negative = below
  monthsToBreakEven: number | null; // null if already above, otherwise months at current trajectory
  isAboveBreakEven: boolean;
}

/**
 * Iterative break-even: find the gross monthly revenue where take-home = 0
 * (i.e., revenue exactly covers expenses + all taxes/contributions).
 * Uses binary search since tax brackets make this non-linear.
 */
export function calculateBreakEven(
  monthlyExpenses: number,
  businessStructure: string = 'sole_proprietorship',
): number {
  let lo = 0;
  let hi = Math.max(monthlyExpenses * 5, 10000); // generous upper bound

  for (let i = 0; i < 50; i++) { // binary search converges fast
    const mid = (lo + hi) / 2;
    const taxes = calculateTaxSnapshot({
      gross_monthly_revenue: mid,
      monthly_expenses: monthlyExpenses,
      business_structure: businessStructure,
    });
    if (taxes.monthly_take_home > 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return Math.ceil((lo + hi) / 2);
}

export function getBreakEvenResult(
  currentMonthlyRevenue: number,
  monthlyExpenses: number,
  businessStructure: string = 'sole_proprietorship',
): BreakEvenResult {
  const breakEvenMonthlyRevenue = calculateBreakEven(monthlyExpenses, businessStructure);
  const surplus = currentMonthlyRevenue - breakEvenMonthlyRevenue;
  const isAboveBreakEven = surplus >= 0;

  // If below break-even, estimate months to reach it assuming 10% monthly growth
  let monthsToBreakEven: number | null = null;
  if (!isAboveBreakEven && currentMonthlyRevenue > 0) {
    const growthRate = 0.10; // 10% monthly growth assumption
    let rev = currentMonthlyRevenue;
    let months = 0;
    while (rev < breakEvenMonthlyRevenue && months < 36) {
      rev *= (1 + growthRate);
      months++;
    }
    monthsToBreakEven = months < 36 ? months : null;
  }

  return {
    breakEvenMonthlyRevenue,
    currentMonthlyRevenue,
    surplus,
    monthsToBreakEven,
    isAboveBreakEven,
  };
}

// ── Pricing calculator ────────────────────────────────────────

export interface PricingResult {
  pricePerUnit: number;
  unitsPerMonth: number;
  grossMonthlyRevenue: number;
  taxes: TaxCalculationResult;
  monthlyTakeHome: number;
  perUnitTakeHome: number;     // how much you actually keep per sale
  perUnitTaxBurden: number;    // how much goes to taxes per sale
}

/**
 * "If I charge $X and sell Y units, what do I take home?"
 */
export function calculatePricing(
  pricePerUnit: number,
  unitsPerMonth: number,
  monthlyExpenses: number,
  businessStructure: string = 'sole_proprietorship',
): PricingResult {
  const grossMonthlyRevenue = pricePerUnit * unitsPerMonth;
  const taxes = calculateTaxSnapshot({
    gross_monthly_revenue: grossMonthlyRevenue,
    monthly_expenses: monthlyExpenses,
    business_structure: businessStructure,
  });
  const monthlyTakeHome = Math.max(0, taxes.monthly_take_home);
  const totalUnits = unitsPerMonth || 1;

  return {
    pricePerUnit,
    unitsPerMonth,
    grossMonthlyRevenue,
    taxes,
    monthlyTakeHome,
    perUnitTakeHome: monthlyTakeHome / totalUnits,
    perUnitTaxBurden: (taxes.total_deductions / 12) / totalUnits,
  };
}

// ── Monthly projection data ───────────────────────────────────

export interface MonthProjection {
  month: number;               // 1-12
  cumulativeRevenue: number;
  cumulativeTakeHome: number;
  cumulativeExpenses: number;
  cumulativeTax: number;
  crossedGstThreshold: boolean;
}

/**
 * Generate 12-month cumulative projections.
 */
export function generateMonthlyProjections(
  monthlyRevenue: number,
  monthlyTakeHome: number,
  monthlyExpenses: number,
  monthlyTax: number,
): MonthProjection[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const cumRev = monthlyRevenue * month;
    return {
      month,
      cumulativeRevenue: cumRev,
      cumulativeTakeHome: Math.max(0, monthlyTakeHome) * month,
      cumulativeExpenses: monthlyExpenses * month,
      cumulativeTax: monthlyTax * month,
      crossedGstThreshold: cumRev >= SALES_TAX_REGISTRATION_THRESHOLD,
    };
  });
}

// ── Funding impact calculator ─────────────────────────────────

export interface FundingImpact {
  totalFundingAvailable: number;     // sum of matched program amounts
  monthsOfRunway: number;            // how many months of expenses this covers
  monthsOfFullIncome: number;        // how many months of take-home this equals
  effectiveRunwayMessage: string;    // human-readable
}

/**
 * Calculate how matched funding extends the user's runway.
 * fundingAmount = total $ available across matched programs.
 */
export function calculateFundingImpact(
  fundingAmount: number,
  monthlyExpenses: number,
  monthlyTakeHome: number,
): FundingImpact {
  const monthsOfRunway = monthlyExpenses > 0
    ? Math.round((fundingAmount / monthlyExpenses) * 10) / 10
    : 0;
  const monthsOfFullIncome = monthlyTakeHome > 0
    ? Math.round((fundingAmount / (monthlyExpenses + monthlyTakeHome)) * 10) / 10
    : 0;

  let effectiveRunwayMessage: string;
  if (fundingAmount <= 0) {
    effectiveRunwayMessage = 'Complete intake to see funding matches.';
  } else if (monthsOfRunway >= 12) {
    effectiveRunwayMessage = `This funding could cover over a year of operating expenses while you build your client base.`;
  } else if (monthsOfRunway >= 6) {
    effectiveRunwayMessage = `This funding could cover ${monthsOfRunway} months of expenses — enough runway to establish your business.`;
  } else {
    effectiveRunwayMessage = `This funding covers ${monthsOfRunway} months of expenses. Focus on reaching break-even quickly.`;
  }

  return {
    totalFundingAvailable: fundingAmount,
    monthsOfRunway,
    monthsOfFullIncome,
    effectiveRunwayMessage,
  };
}
