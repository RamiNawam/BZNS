'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { calculateTakeHome } from '@/lib/financial/tax-calculator';

const EXPENSE_DEFAULTS: Record<string, number> = {
  food: 390, freelance: 360, daycare: 215,
  retail: 300, personal_care: 250, creative: 200, tech: 300, other: 200,
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export default function SnapshotCard() {
  const { profile } = useProfileStore();
  const monthlyRevenue  = profile?.expected_monthly_revenue ?? 0;
  const monthlyExpenses = EXPENSE_DEFAULTS[profile?.business_type ?? 'other'] ?? 200;

  const taxes = useMemo(
    () => calculateTakeHome(monthlyRevenue * 12, monthlyExpenses * 12),
    [monthlyRevenue, monthlyExpenses],
  );

  const monthlyTakeHome = Math.max(0, taxes.estimatedTakeHome / 12 - monthlyExpenses);
  const totalMonthlyTax = taxes.totalTax / 12;
  const total = monthlyRevenue || 1;

  const segments = [
    { value: totalMonthlyTax, color: 'bg-red-400',    label: `Tax ${fmt(totalMonthlyTax)}/mo` },
    { value: monthlyExpenses, color: 'bg-slate-300',  label: `Expenses ${fmt(monthlyExpenses)}/mo` },
    { value: monthlyTakeHome, color: 'bg-brand-500',  label: `Keep ${fmt(monthlyTakeHome)}/mo` },
  ];

  if (!monthlyRevenue) return null;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-brand-50">
            <Wallet size={15} className="text-brand-600" />
          </div>
          <span className="font-heading font-semibold text-slate-900 text-sm">Financial Snapshot</span>
        </div>
        <Link href="/financial" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
          Full breakdown <ArrowRight size={11} />
        </Link>
      </div>

      {/* Take-home hero number */}
      <div>
        <p className="text-xs text-slate-500 mb-0.5">Estimated monthly take-home</p>
        <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums">{fmt(monthlyTakeHome)}</p>
        <p className="text-xs text-slate-400 mt-0.5">after taxes, QPP &amp; ~{fmt(monthlyExpenses)} expenses</p>
      </div>

      {/* Mini waterfall bar */}
      <div>
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {segments.map((s, i) => (
            <div
              key={i}
              className={`${s.color} transition-all duration-500 ease-out`}
              style={{ width: `${Math.max(0, (s.value / total) * 100)}%` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {segments.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${s.color} shrink-0`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
