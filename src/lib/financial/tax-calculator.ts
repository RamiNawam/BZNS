import {
  FEDERAL_TAX_BRACKETS,
  FEDERAL_BASIC_PERSONAL_AMOUNT,
  FEDERAL_QC_ABATEMENT,
  QUEBEC_TAX_BRACKETS,
  QUEBEC_BASIC_PERSONAL_AMOUNT,
  QPP_BASIC_EXEMPTION,
  QPP_MAX_PENSIONABLE_EARNINGS,
  QPP_SELF_EMPLOYED_RATE,
  QPP2_YAMPE,
  QPP2_SELF_EMPLOYED_RATE,
  QPIP_SELF_EMPLOYED_RATE,
  QPIP_MAX_INSURABLE_EARNINGS,
  QPIP_BASIC_EXEMPTION,
} from './constants';

export interface TaxSnapshot {
  grossIncome: number;
  businessExpenses: number;
  netBusinessIncome: number;
  qpp: number;
  qpip: number;
  qppEmployerDeduction: number; // Deductible employer-equivalent portion
  federalTaxableIncome: number;
  federalTax: number;
  quebecTax: number;
  totalTax: number;
  estimatedTakeHome: number;
  effectiveTaxRate: number;
  warnings: string[];
}

/**
 * Calculate marginal tax using a bracket table.
 */
function applyBrackets(
  income: number,
  brackets: readonly { min: number; max: number | typeof Infinity; rate: number }[]
): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const taxable = Math.min(income, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

/**
 * Calculate a full self-employed tax snapshot for a Quebec resident.
 */
export function calculateTakeHome(
  grossIncome: number,
  businessExpenses = 0
): TaxSnapshot {
  const warnings: string[] = [];
  const netBusinessIncome = Math.max(0, grossIncome - businessExpenses);

  // QPP contributions
  const qppContributoryEarnings = Math.max(
    0,
    Math.min(netBusinessIncome, QPP_MAX_PENSIONABLE_EARNINGS) - QPP_BASIC_EXEMPTION
  );
  const qpp = qppContributoryEarnings * QPP_SELF_EMPLOYED_RATE;

  // QPP2
  const qpp2ContributoryEarnings = Math.max(
    0,
    Math.min(netBusinessIncome, QPP2_YAMPE) - QPP_MAX_PENSIONABLE_EARNINGS
  );
  const qpp2 = qpp2ContributoryEarnings * QPP2_SELF_EMPLOYED_RATE;
  const totalQpp = qpp + qpp2;

  // QPIP contributions
  const qpipInsurableEarnings = Math.max(
    0,
    Math.min(netBusinessIncome, QPIP_MAX_INSURABLE_EARNINGS) - QPIP_BASIC_EXEMPTION
  );
  const qpip = qpipInsurableEarnings * QPIP_SELF_EMPLOYED_RATE;

  // Deductible employer-equivalent portion of QPP (50%)
  const qppEmployerDeduction = totalQpp * 0.5;

  // Federal taxable income
  const federalTaxableIncome = Math.max(
    0,
    netBusinessIncome - qppEmployerDeduction - FEDERAL_BASIC_PERSONAL_AMOUNT
  );
  const federalTaxBefore = applyBrackets(federalTaxableIncome, FEDERAL_TAX_BRACKETS as never);
  const federalTax = Math.max(0, federalTaxBefore * (1 - FEDERAL_QC_ABATEMENT));

  // Quebec taxable income
  const quebecTaxableIncome = Math.max(
    0,
    netBusinessIncome - qppEmployerDeduction - QUEBEC_BASIC_PERSONAL_AMOUNT
  );
  const quebecTax = applyBrackets(quebecTaxableIncome, QUEBEC_TAX_BRACKETS as never);

  const totalTax = federalTax + quebecTax + totalQpp + qpip;
  const estimatedTakeHome = netBusinessIncome - totalTax;
  const effectiveTaxRate = netBusinessIncome > 0 ? totalTax / netBusinessIncome : 0;

  // Warnings
  if (grossIncome >= 30000) {
    warnings.push('You must register for GST and QST once taxable revenues exceed $30,000');
  }
  if (estimatedTakeHome < 0) {
    warnings.push('Expenses exceed income — review your financial projections');
  }

  return {
    grossIncome,
    businessExpenses,
    netBusinessIncome,
    qpp: totalQpp,
    qpip,
    qppEmployerDeduction,
    federalTaxableIncome,
    federalTax,
    quebecTax,
    totalTax,
    estimatedTakeHome,
    effectiveTaxRate,
    warnings,
  };
}
