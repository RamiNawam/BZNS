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
  const rows = [
    { label: 'Gross Income', value: snapshot.grossIncome, bold: false },
    { label: 'Business Expenses', value: -snapshot.businessExpenses, bold: false },
    { label: 'Net Business Income', value: snapshot.netBusinessIncome, bold: true },
    { label: 'QPP Contributions', value: -snapshot.qpp, bold: false },
    { label: 'QPIP Contributions', value: -snapshot.qpip, bold: false },
    { label: 'Federal Income Tax', value: -snapshot.federalTax, bold: false },
    { label: 'Quebec Income Tax', value: -snapshot.quebecTax, bold: false },
    { label: 'Estimated Take-Home', value: snapshot.estimatedTakeHome, bold: true },
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
                    : row.value < 0
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}
              >
                {formatCAD(row.value)}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td className="px-4 py-2 text-xs text-gray-500">Effective Tax Rate</td>
            <td className="px-4 py-2 text-right text-xs text-gray-500 tabular-nums">
              {formatPct(snapshot.effectiveTaxRate)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
