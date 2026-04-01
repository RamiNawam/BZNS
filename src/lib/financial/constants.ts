/**
 * Financial constants for Quebec 2026.
 * Mirrors data/financial_constants.json but as typed TypeScript constants
 * for use in the tax calculator.
 */

export const TAX_YEAR = 2026;
export const PROVINCE = 'QC';

// Federal income tax brackets
export const FEDERAL_TAX_BRACKETS = [
  { min: 0, max: 57375, rate: 0.15 },
  { min: 57375, max: 114750, rate: 0.205 },
  { min: 114750, max: 158519, rate: 0.26 },
  { min: 158519, max: 220000, rate: 0.29 },
  { min: 220000, max: Infinity, rate: 0.33 },
] as const;

export const FEDERAL_BASIC_PERSONAL_AMOUNT = 16129;
export const FEDERAL_QC_ABATEMENT = 0.165; // 16.5% reduction of federal tax for QC residents

// Quebec provincial income tax brackets
export const QUEBEC_TAX_BRACKETS = [
  { min: 0, max: 53255, rate: 0.14 },
  { min: 53255, max: 106495, rate: 0.19 },
  { min: 106495, max: 129590, rate: 0.24 },
  { min: 129590, max: Infinity, rate: 0.2575 },
] as const;

export const QUEBEC_BASIC_PERSONAL_AMOUNT = 17183;

// Sales taxes
export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;
export const COMBINED_SALES_TAX_RATE = 0.14975;
export const SALES_TAX_REGISTRATION_THRESHOLD = 30000;

// QPP (Quebec Pension Plan)
export const QPP_BASIC_EXEMPTION = 3500;
export const QPP_MAX_PENSIONABLE_EARNINGS = 73200;
export const QPP_SELF_EMPLOYED_RATE = 0.108;
export const QPP2_YAMPE = 81200;
export const QPP2_SELF_EMPLOYED_RATE = 0.08;

// QPIP (Quebec Parental Insurance Plan)
export const QPIP_SELF_EMPLOYED_RATE = 0.01186;
export const QPIP_MAX_INSURABLE_EARNINGS = 98000;
export const QPIP_BASIC_EXEMPTION = 2000;
