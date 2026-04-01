export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface FinancialSnapshot {
  grossIncome: number;
  businessExpenses: number;
  netBusinessIncome: number;
  qpp: number;
  qpip: number;
  federalTax: number;
  quebecTax: number;
  totalTax: number;
  estimatedTakeHome: number;
  effectiveTaxRate: number;
  warnings: string[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  isDeductible: boolean;
  deductiblePercentage: number;
}

export interface FinancialInputs {
  grossRevenue: number;
  expenses: ExpenseCategory[];
  province: string;
  businessStructure: string;
}
