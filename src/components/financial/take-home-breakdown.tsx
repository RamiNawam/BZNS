import type { FinancialSnapshot } from '@/types/financial';
import {
  FEDERAL_TAX_BRACKETS,
  QUEBEC_TAX_BRACKETS,
  FEDERAL_BASIC_PERSONAL_AMOUNT,
  QUEBEC_BASIC_PERSONAL_AMOUNT,
  type TaxBracket,
} from '@/lib/financial/constants';

interface TakeHomeBreakdownProps {
  snapshot: FinancialSnapshot;
}

function formatCAD(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function fmtK(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

// ── Tax Bracket Bar ─────────────────────────────────────────────────────────
function TaxBracketBar({
  brackets,
  income,
  personalAmount,
  label,
}: {
  brackets: readonly TaxBracket[];
  income: number;
  personalAmount: number;
  label: string;
}) {
  // Cap the visual at the last bracket + some headroom
  const lastBracketMin = brackets[brackets.length - 1].min;
  const visualMax = Math.max(lastBracketMin * 1.15, income * 1.1, 80000);

  // Find which bracket the user is in
  let activeBracketIdx = 0;
  for (let i = 0; i < brackets.length; i++) {
    if (income > brackets[i].min) activeBracketIdx = i;
  }

  const markerPct = Math.min((income / visualMax) * 100, 98);

  // Bracket colors — from lightest to darkest
  const colors = [
    'bg-teal-100', 'bg-teal-200', 'bg-amber-200', 'bg-amber-300', 'bg-red-300',
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs text-slate-500">
          Net income: <span className="font-semibold text-slate-700 tabular-nums">{formatCAD(income)}</span>
        </span>
      </div>

      {/* The bar */}
      <div className="relative">
        <div className="flex h-5 rounded-md overflow-hidden">
          {brackets.map((b, i) => {
            const start = b.min;
            const end = b.max ?? visualMax;
            const width = ((Math.min(end, visualMax) - start) / visualMax) * 100;
            const isActive = i === activeBracketIdx && income > 0;
            return (
              <div
                key={i}
                className={`${colors[i] ?? 'bg-red-400'} relative flex items-center justify-center transition-all
                  ${isActive ? 'ring-1 ring-inset ring-slate-900/20' : ''}
                  ${i < brackets.length - 1 ? 'border-r border-white/60' : ''}`}
                style={{ width: `${Math.max(width, 2)}%` }}
                title={`${fmtK(start)}${b.max ? `–${fmtK(b.max)}` : '+'} → ${(b.rate * 100).toFixed(1)}%`}
              >
                <span className="text-[9px] font-medium text-slate-700/80 truncate px-0.5 select-none">
                  {(b.rate * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* "You are here" marker */}
        {income > 0 && (
          <div
            className="absolute top-0 h-5 w-0.5 bg-slate-900 transition-all duration-500 ease-out"
            style={{ left: `${markerPct}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[10px] font-semibold text-slate-900 bg-white/90 px-1 rounded shadow-sm">
                You
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bracket labels underneath */}
      <div className="flex text-[9px] text-slate-400 tabular-nums">
        {brackets.map((b, i) => {
          const end = b.max ?? visualMax;
          const width = ((Math.min(end, visualMax) - b.min) / visualMax) * 100;
          return (
            <div key={i} style={{ width: `${Math.max(width, 2)}%` }} className="truncate px-0.5">
              {fmtK(b.min)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TakeHomeBreakdown({ snapshot }: TakeHomeBreakdownProps) {
  const annualRevenue = snapshot.annual_revenue ?? snapshot.gross_monthly_revenue * 12;
  const netIncome = snapshot.net_revenue ?? 0;

  const rows = [
    { label: 'Annual Revenue',       value: annualRevenue,                            bold: false },
    { label: 'Business Expenses',    value: -(snapshot.monthly_expenses * 12),        bold: false },
    { label: 'Net Revenue',          value: snapshot.net_revenue,                     bold: true  },
    { label: 'QPP Contributions',    value: snapshot.qpp_contribution != null ? -snapshot.qpp_contribution : null, bold: false },
    { label: 'QPIP Premium',         value: snapshot.qpip_premium    != null ? -snapshot.qpip_premium    : null, bold: false },
    { label: 'Federal Income Tax',   value: snapshot.federal_income_tax   != null ? -snapshot.federal_income_tax   : null, bold: false },
    { label: 'Québec Income Tax',    value: snapshot.provincial_income_tax != null ? -snapshot.provincial_income_tax : null, bold: false },
    { label: 'Monthly Take-Home',    value: snapshot.monthly_take_home,               bold: true  },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={`border-b border-gray-100 ${row.bold ? 'bg-brand-50' : ''}`}>
                <td className={`px-4 py-2 text-gray-600 ${row.bold ? 'font-semibold text-gray-900' : ''}`}>
                  {row.label}
                </td>
                <td
                  className={`px-4 py-2 text-right tabular-nums ${
                    row.bold
                      ? 'font-semibold text-gray-900'
                      : (row.value ?? 0) < 0
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}
                >
                  {formatCAD(row.value)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-4 py-2 text-xs text-gray-500">Effective Take-Home Rate</td>
              <td className="px-4 py-2 text-right text-xs text-gray-500 tabular-nums">
                {formatPct(snapshot.effective_take_home_rate)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tax Bracket Bars */}
      {netIncome > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 space-y-5">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Your Tax Brackets</h3>
          <TaxBracketBar
            brackets={FEDERAL_TAX_BRACKETS}
            income={Math.max(0, netIncome - FEDERAL_BASIC_PERSONAL_AMOUNT)}
            personalAmount={FEDERAL_BASIC_PERSONAL_AMOUNT}
            label="Federal"
          />
          <TaxBracketBar
            brackets={QUEBEC_TAX_BRACKETS}
            income={Math.max(0, netIncome - QUEBEC_BASIC_PERSONAL_AMOUNT)}
            personalAmount={QUEBEC_BASIC_PERSONAL_AMOUNT}
            label="Québec"
          />
          <p className="text-[10px] text-slate-400">
            Taxable income = net revenue minus personal amount ({fmtK(FEDERAL_BASIC_PERSONAL_AMOUNT)} federal, {fmtK(QUEBEC_BASIC_PERSONAL_AMOUNT)} QC)
          </p>
        </div>
      )}
    </div>
  );
}
