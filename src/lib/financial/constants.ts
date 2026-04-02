/**
 * Deterministic financial constants for Quebec.
 * Keep these synchronized with /data/financial_constants.json.
 */

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export const TAX_YEAR = 2026;
export const PROVINCE = 'QC';

export const FEDERAL_TAX_BRACKETS: readonly TaxBracket[] = [
  { min: 0, max: 57375, rate: 0.15 },
  { min: 57375, max: 114750, rate: 0.205 },
  { min: 114750, max: 158468, rate: 0.26 },
  { min: 158468, max: 221708, rate: 0.29 },
  { min: 221708, max: null, rate: 0.33 },
] as const;

export const FEDERAL_BASIC_PERSONAL_AMOUNT = 16129;
export const FEDERAL_QC_ABATEMENT = 0.165;

export const QUEBEC_TAX_BRACKETS: readonly TaxBracket[] = [
  { min: 0, max: 52455, rate: 0.14 },
  { min: 52455, max: 104910, rate: 0.19 },
  { min: 104910, max: 126590, rate: 0.24 },
  { min: 126590, max: null, rate: 0.2575 },
] as const;

export const QUEBEC_BASIC_PERSONAL_AMOUNT = 18056;

export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;
export const SALES_TAX_REGISTRATION_THRESHOLD = 30000;

export const QPP_BASIC_EXEMPTION = 3500;
export const QPP_MAX_PENSIONABLE_EARNINGS = 71300;
export const QPP_SELF_EMPLOYED_RATE = 0.128;

export const QPIP_SELF_EMPLOYED_RATE = 0.00878;
export const QPIP_MAX_INSURABLE_EARNINGS = 98000;

export const QUARTERLY_INSTALLMENT_THRESHOLD = 3000;
