import type { FinancialSnapshot } from '@/types/financial';

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

export default function TakeHomeBreakdown({ snapshot }: TakeHomeBreakdownProps) {
  const annualRevenue = snapshot.annual_revenue ?? snapshot.gross_monthly_revenue * 12;
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
  );
}
