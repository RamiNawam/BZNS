import {
  FEDERAL_TAX_BRACKETS,
  FEDERAL_BASIC_PERSONAL_AMOUNT,
  FEDERAL_QC_ABATEMENT,
  QUEBEC_TAX_BRACKETS,
  QUEBEC_BASIC_PERSONAL_AMOUNT,
  GST_RATE,
  QST_RATE,
  SALES_TAX_REGISTRATION_THRESHOLD,
  QPP_BASIC_EXEMPTION,
  QPP_MAX_PENSIONABLE_EARNINGS,
  QPP_SELF_EMPLOYED_RATE,
  QPIP_SELF_EMPLOYED_RATE,
  QPIP_MAX_INSURABLE_EARNINGS,
  QUARTERLY_INSTALLMENT_THRESHOLD,
} from './constants';
import type { BusinessStructure } from '@/types/profile';
import type { TaxCalculationResult } from '@/types/financial';

export interface TaxCalculatorInput {
  gross_monthly_revenue: number;
  monthly_expenses: number;
  business_structure: BusinessStructure | string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function applyBrackets(
  income: number,
  brackets: readonly { min: number; max: number | null; rate: number }[],
): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const bracketCap = bracket.max ?? Number.POSITIVE_INFINITY;
    const taxableInBracket = Math.max(0, Math.min(income, bracketCap) - bracket.min);
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
}

export function calculateTaxSnapshot(input: TaxCalculatorInput): TaxCalculationResult {
  const grossMonthlyRevenue = Math.max(0, input.gross_monthly_revenue);
  const monthlyExpenses = Math.max(0, input.monthly_expenses);

  const annualRevenue = grossMonthlyRevenue * 12;
  const annualExpenses = monthlyExpenses * 12;
  const netRevenue = Math.max(0, annualRevenue - annualExpenses);

  const mustRegisterSalesTax = annualRevenue > SALES_TAX_REGISTRATION_THRESHOLD;
  const gstCollected = mustRegisterSalesTax ? annualRevenue * GST_RATE : 0;
  const qstCollected = mustRegisterSalesTax ? annualRevenue * QST_RATE : 0;
  const gstQstRemittance = gstCollected + qstCollected;

  // For this release, we treat partnership the same as sole_prop at the individual level.
  const isPersonalTaxPath =
    input.business_structure === 'sole_proprietorship' ||
    input.business_structure === 'partnership' ||
    !input.business_structure;

  let federalIncomeTax = 0;
  let provincialIncomeTax = 0;
  let qppContribution = 0;
  let qpipPremium = 0;

  if (isPersonalTaxPath) {
    const federalTaxableIncome = Math.max(0, netRevenue - FEDERAL_BASIC_PERSONAL_AMOUNT);
    const federalBeforeAbatement = applyBrackets(federalTaxableIncome, FEDERAL_TAX_BRACKETS);
    federalIncomeTax = federalBeforeAbatement * (1 - FEDERAL_QC_ABATEMENT);

    const provincialTaxableIncome = Math.max(0, netRevenue - QUEBEC_BASIC_PERSONAL_AMOUNT);
    provincialIncomeTax = applyBrackets(provincialTaxableIncome, QUEBEC_TAX_BRACKETS);

    const qppPensionableIncome = Math.max(
      0,
      Math.min(netRevenue, QPP_MAX_PENSIONABLE_EARNINGS) - QPP_BASIC_EXEMPTION,
    );
    qppContribution = qppPensionableIncome * QPP_SELF_EMPLOYED_RATE;

    const qpipInsurableIncome = Math.max(0, Math.min(netRevenue, QPIP_MAX_INSURABLE_EARNINGS));
    qpipPremium = qpipInsurableIncome * QPIP_SELF_EMPLOYED_RATE;
  } else {
    // Corporation path not fully modeled yet; keep deterministic but conservative.
    federalIncomeTax = 0;
    provincialIncomeTax = 0;
    qppContribution = 0;
    qpipPremium = 0;
  }

  const totalDeductions = federalIncomeTax + provincialIncomeTax + qppContribution + qpipPremium;
  const annualTakeHome = Math.max(0, netRevenue - totalDeductions);
  const monthlyTakeHome = annualTakeHome / 12;
  const effectiveTakeHomeRate = grossMonthlyRevenue > 0 ? monthlyTakeHome / grossMonthlyRevenue : 0;
  const quarterlyInstallment =
    totalDeductions >= QUARTERLY_INSTALLMENT_THRESHOLD ? totalDeductions / 4 : 0;

  return {
    annual_revenue: round2(annualRevenue),
    gst_collected: round2(gstCollected),
    qst_collected: round2(qstCollected),
    gst_qst_remittance: round2(gstQstRemittance),
    net_revenue: round2(netRevenue),
    federal_income_tax: round2(federalIncomeTax),
    provincial_income_tax: round2(provincialIncomeTax),
    qpp_contribution: round2(qppContribution),
    qpip_premium: round2(qpipPremium),
    total_deductions: round2(totalDeductions),
    monthly_take_home: round2(monthlyTakeHome),
    effective_take_home_rate: round2(effectiveTakeHomeRate),
    quarterly_installment: round2(quarterlyInstallment),
  };
}

/**
 * Convenience alias used by the frontend financial page and snapshot card.
 * Accepts annualRevenue and annualExpenses directly (already multiplied by 12).
 * Returns all snake_case fields PLUS camelCase aliases for frontend compatibility.
 */
export function calculateTakeHome(
  annualRevenue: number,
  annualExpenses: number,
  businessStructure: string = 'sole_proprietorship',
): TaxCalculationResult & {
  federalTax: number;
  quebecTax: number;
  qpp: number;
  qpip: number;
  estimatedTakeHome: number;
  totalTax: number;
  effectiveTaxRate: number;
  netBusinessIncome: number;
} {
  const r = calculateTaxSnapshot({
    gross_monthly_revenue: annualRevenue / 12,
    monthly_expenses: annualExpenses / 12,
    business_structure: businessStructure,
  });
  return {
    ...r,
    // camelCase aliases for frontend components
    federalTax:        r.federal_income_tax,
    quebecTax:         r.provincial_income_tax,
    qpp:               r.qpp_contribution,
    qpip:              r.qpip_premium,
    estimatedTakeHome: r.monthly_take_home,
    totalTax:          r.total_deductions,
    effectiveTaxRate:  r.effective_take_home_rate,
    netBusinessIncome: r.net_revenue,
  };
}
