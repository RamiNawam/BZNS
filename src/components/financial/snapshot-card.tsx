'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { calculateTakeHome } from '@/lib/financial/tax-calculator';
import { getExpenseDefaults } from '@/lib/financial/expense-defaults';
import type { ClusterID } from '@/lib/clusters';

export default function SnapshotCard() {
  const { profile } = useProfileStore();
  const { t, locale } = useTranslation();
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  const monthlyRevenue  = profile?.expected_monthly_revenue ?? 0;
  const clusterId = (profile?.cluster_id ?? 'C2') as ClusterID;
  const monthlyExpenses = profile?.monthly_expenses ?? getExpenseDefaults(clusterId).total;
  const businessStructure = profile?.business_structure ?? 'sole_proprietorship';

  const taxes = useMemo(
    () => calculateTakeHome(monthlyRevenue * 12, monthlyExpenses * 12, businessStructure),
    [monthlyRevenue, monthlyExpenses, businessStructure],
  );

  // estimatedTakeHome is already monthly and already net of expenses
  const monthlyTakeHome = Math.max(0, taxes.estimatedTakeHome);
  const totalMonthlyTax = taxes.totalTax / 12;
  const total = monthlyRevenue || 1;

  const segments = [
    { value: totalMonthlyTax, color: 'bg-red-400',    label: `${t('financial.snapshotCard.tax')} ${fmt(totalMonthlyTax)}/mo` },
    { value: monthlyExpenses, color: 'bg-slate-300',  label: `${t('financial.snapshotCard.expenses')} ${fmt(monthlyExpenses)}/mo` },
    { value: monthlyTakeHome, color: 'bg-brand-500',  label: `${t('financial.snapshotCard.keep')} ${fmt(monthlyTakeHome)}/mo` },
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
          <span className="font-heading font-semibold text-slate-900 text-sm">{t('financial.snapshotCard.title')}</span>
        </div>
        <Link href="/financial" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
          {t('financial.snapshotCard.fullBreakdown')} <ArrowRight size={11} />
        </Link>
      </div>

      {/* Take-home hero number */}
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{t('financial.snapshotCard.estimatedTakeHome')}</p>
        <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums">{fmt(monthlyTakeHome)}</p>
        <p className="text-xs text-slate-400 mt-0.5">{t('financial.snapshotCard.afterTaxes').replace('{expenses}', fmt(monthlyExpenses))}</p>
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
