'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Info,
  Calendar,
  Calculator,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { calculateTakeHome } from '@/lib/financial/tax-calculator';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

const EXPENSE_DEFAULTS: Record<string, number> = {
  food:          390,
  freelance:     360,
  daycare:       215,
  retail:        300,
  personal_care: 250,
  creative:      200,
  tech:          300,
  other:         200,
};

const EXPENSE_HINTS: Record<string, string> = {
  food:          'Ingredients ~$250, packaging ~$80, market fees ~$60',
  freelance:     'Software subs ~$120, phone ~$40, home office ~$200',
  daycare:       'Toys/supplies ~$80, children\'s food ~$120, first aid ~$15',
  retail:        'Inventory, shipping, platform fees',
  personal_care: 'Products, tools, insurance',
  creative:      'Software, equipment amortization, subscriptions',
  tech:          'Cloud services, software, hardware amortization',
  other:         'Adjust based on your actual costs',
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GST_THRESHOLD = 30_000;

// ── Waterfall Bar ─────────────────────────────────────────────────────────────

function WaterfallBar({
  grossMonthly,
  taxes,
  monthlyExpenses,
}: {
  grossMonthly: number;
  taxes: ReturnType<typeof calculateTakeHome>;
  monthlyExpenses: number;
}) {
  const segments = [
    { label: 'Federal Tax',  value: taxes.federalTax / 12,  color: 'bg-red-400',    textColor: 'text-red-600'   },
    { label: 'Quebec Tax',   value: taxes.quebecTax / 12,   color: 'bg-orange-400', textColor: 'text-orange-600' },
    { label: 'QPP',          value: taxes.qpp / 12,         color: 'bg-amber-400',  textColor: 'text-amber-600' },
    { label: 'QPIP',         value: taxes.qpip / 12,        color: 'bg-yellow-300', textColor: 'text-yellow-600' },
    { label: 'Expenses',     value: monthlyExpenses,        color: 'bg-slate-300',  textColor: 'text-slate-500' },
    { label: 'Take-home',    value: Math.max(0, taxes.estimatedTakeHome / 12 - monthlyExpenses), color: 'bg-brand-500', textColor: 'text-brand-700' },
  ];
  const total = grossMonthly || 1;

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-10 rounded-xl overflow-hidden gap-0.5">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all duration-500 ease-out first:rounded-l-xl last:rounded-r-xl`}
            style={{ width: `${Math.max(0, (s.value / total) * 100)}%` }}
            title={`${s.label}: ${fmt(s.value)}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 min-w-0">
            <div className={`h-2.5 w-2.5 rounded-full ${s.color} shrink-0`} />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{s.label}</div>
              <div className={`text-xs font-bold tabular-nums ${s.textColor}`}>{fmt(s.value)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Projection Chart (SVG) ────────────────────────────────────────────────────

function ProjectionChart({
  monthlyRevenue,
  monthlyTakeHome,
}: {
  monthlyRevenue: number;
  monthlyTakeHome: number;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const revData  = months.map((m) => monthlyRevenue * m);
  const thData   = months.map((m) => Math.max(0, monthlyTakeHome) * m);
  const maxY = Math.max(...revData, GST_THRESHOLD * 1.15, 1000);

  const W = 560; const H = 180; const PL = 48; const PR = 16; const PT = 12; const PB = 28;
  const iW = W - PL - PR; const iH = H - PT - PB;

  const xS = (m: number) => PL + ((m - 1) / 11) * iW;
  const yS = (v: number) => PT + iH - (v / maxY) * iH;

  const revPath = revData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xS(i + 1).toFixed(1)} ${yS(v).toFixed(1)}`).join(' ');
  const thPath  = thData.map((v, i)  => `${i === 0 ? 'M' : 'L'} ${xS(i + 1).toFixed(1)} ${yS(v).toFixed(1)}`).join(' ');
  const gstY = yS(GST_THRESHOLD);
  const crossMonth = months.find((m) => monthlyRevenue * m >= GST_THRESHOLD);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({ v: maxY * p, y: yS(maxY * p) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-slate-900 text-sm">12-Month Projection</h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-0.5 w-4 bg-brand-500 rounded" />Revenue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-0.5 w-4 bg-emerald-400 rounded" style={{ borderTop: '2px dashed #34d399' }} />Take-home
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-red-400" />GST limit
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="12-month revenue and take-home projection">
        {/* Y grid + labels */}
        {yTicks.map(({ v, y }) => (
          <g key={v}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="9">
              {v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`}
            </text>
          </g>
        ))}

        {/* GST threshold */}
        {gstY > PT && gstY < PT + iH && (
          <>
            <line x1={PL} y1={gstY} x2={W - PR} y2={gstY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7" />
            <text x={W - PR - 2} y={gstY - 3} textAnchor="end" fill="#ef4444" fontSize="9" opacity="0.85">$30K GST/QST</text>
          </>
        )}

        {/* Revenue line */}
        <path d={revPath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Take-home line */}
        <path d={thPath} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />

        {/* Dots at each month (revenue) */}
        {revData.map((v, i) => (
          <circle key={i} cx={xS(i + 1)} cy={yS(v)} r="2.5" fill="#0d9488" />
        ))}

        {/* X axis month labels (every other) */}
        {months.filter((_, i) => i % 2 === 0).map((m) => (
          <text key={m} x={xS(m)} y={H - 6} textAnchor="middle" fill="#94a3b8" fontSize="10">
            {MONTH_LABELS[m - 1]}
          </text>
        ))}
      </svg>

      {crossMonth && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertTriangle size={12} className="shrink-0" />
          You&apos;ll cross the $30,000 GST/QST threshold in <strong className="mx-0.5">month {crossMonth}</strong> — register before then.
        </div>
      )}
      {!crossMonth && monthlyRevenue > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <Info size={12} className="shrink-0" />
          At this revenue level you stay under the $30,000 threshold — no GST/QST registration required this year.
        </div>
      )}
    </div>
  );
}

// ── Tax Calendar ──────────────────────────────────────────────────────────────

function TaxCalendar({ quarterlyInstallment }: { quarterlyInstallment: number }) {
  const events = [
    { date: 'Mar 15', label: '1st Installment', amount: quarterlyInstallment, color: 'bg-amber-500' },
    { date: 'Apr 30', label: 'Balance due', amount: null, color: 'bg-red-500' },
    { date: 'Jun 15', label: '2nd Install. + Return', amount: quarterlyInstallment, color: 'bg-amber-500' },
    { date: 'Sep 15', label: '3rd Installment', amount: quarterlyInstallment, color: 'bg-amber-500' },
    { date: 'Dec 15', label: '4th Installment', amount: quarterlyInstallment, color: 'bg-amber-500' },
  ];

  return (
    <div>
      <h3 className="font-heading font-semibold text-slate-900 text-sm mb-5">2026 Tax Calendar</h3>
      <div className="relative">
        <div className="absolute top-3.5 left-4 right-4 h-px bg-slate-200" />
        <div className="relative flex justify-between items-start">
          {events.map((e, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className={`h-7 w-7 rounded-full ${e.color} flex items-center justify-center z-10 shadow-sm shrink-0`}>
                <Calendar size={12} className="text-white" />
              </div>
              <div className="text-center px-0.5">
                <div className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{e.date}</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5 text-center">{e.label}</div>
                {e.amount != null && e.amount > 0 && (
                  <div className="text-[10px] font-bold text-amber-700 tabular-nums mt-0.5">{fmt(e.amount)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        * Installments required when total tax &gt; $1,800/year. Self-employed filing deadline is June 15, but any balance owed is due April 30.
      </p>
    </div>
  );
}

// ── QPP Shock Explainer ───────────────────────────────────────────────────────

function QPPShock({ qppMonthly, income }: { qppMonthly: number; income: number }) {
  const employeeEquiv = qppMonthly / 2; // employee pays only half
  return (
    <div className="card-brand rounded-xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-heading font-semibold text-slate-900 text-sm">The QPP Double Contribution</h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            As a self-employed person, you pay <strong>both</strong> the employee AND employer share of QPP.
            An employee at the same income would pay only {fmt(employeeEquiv)}/mo — you pay{' '}
            <strong className="text-amber-700">{fmt(qppMonthly)}/mo</strong>.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Employee at same income</div>
          <div className="font-heading font-bold text-slate-700 tabular-nums">{fmt(employeeEquiv)}<span className="text-xs font-normal text-slate-400">/mo</span></div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
          <div className="text-xs text-amber-700 mb-1">You (self-employed)</div>
          <div className="font-heading font-bold text-amber-700 tabular-nums">{fmt(qppMonthly)}<span className="text-xs font-normal text-amber-500">/mo</span></div>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        💡 The good news: half of your QPP is tax-deductible, reducing your taxable income.
      </p>
    </div>
  );
}

// ── Deterministic Watch-Out Flags ────────────────────────────────────────────

function generateFlags(
  taxes: ReturnType<typeof calculateTakeHome>,
  monthlyRevenue: number,
  monthlyExpenses: number,
  businessType: string,
) {
  const flags: { type: 'warning' | 'info' | 'tip'; icon: typeof AlertTriangle; title: string; detail: string }[] = [];
  const annualRevenue = monthlyRevenue * 12;
  const monthlyTakeHome = Math.max(0, taxes.estimatedTakeHome / 12 - monthlyExpenses);
  const totalTax = taxes.totalTax;

  // GST threshold
  if (annualRevenue >= 25000 && annualRevenue < 30000) {
    flags.push({ type: 'warning', icon: AlertTriangle, title: 'Approaching GST/QST threshold', detail: `You're ${fmt(30000 - annualRevenue)} away from the $30,000 registration threshold. Plan to register before you cross it to avoid penalties.` });
  } else if (annualRevenue >= 30000) {
    flags.push({ type: 'warning', icon: AlertTriangle, title: 'GST/QST registration required', detail: `At $${(annualRevenue / 1000).toFixed(0)}K/year, you must register for GST/QST within 30 days of crossing the threshold and start collecting sales tax.` });
  }

  // Installments
  if (totalTax > 1800) {
    const installment = totalTax / 4;
    flags.push({ type: 'info', icon: Info, title: 'Quarterly tax installments apply', detail: `Your estimated tax (${fmt(totalTax)}/yr) exceeds $1,800 — you must pay ${fmt(installment)} quarterly starting March 15. Set this aside monthly.` });
  }

  // QPP shock (always relevant)
  flags.push({ type: 'warning', icon: AlertTriangle, title: 'Budget for QPP — most first-timers miss this', detail: `QPP costs self-employed people 10.8% of net income (both shares). That's ${fmt(taxes.qpp / 12)}/month you need to set aside — it's not deducted automatically.` });

  // Business type tips
  if (businessType === 'food') {
    flags.push({ type: 'tip', icon: Lightbulb, title: 'Track mileage to markets', detail: 'Driving to farmers markets, ingredient shopping, and deliveries is deductible. At the 2026 rate of $0.72/km, 200km/month = $144 in deductions — about $36 in tax savings.' });
  } else if (businessType === 'freelance' || businessType === 'tech') {
    flags.push({ type: 'tip', icon: Lightbulb, title: 'Home office deduction available', detail: 'If you work from home, you can deduct a proportional share of rent, utilities, and internet. A 10m² office in a 100m² home = 10% of housing costs deductible.' });
  } else if (businessType === 'daycare') {
    flags.push({ type: 'tip', icon: Lightbulb, title: 'STA income support during startup', detail: 'The Service de garde en milieu familial STA program provides income support while you build up your enrollment. Apply through your RCE before opening.' });
  }

  // Take-home health
  if (monthlyTakeHome < monthlyExpenses) {
    flags.push({ type: 'warning', icon: AlertTriangle, title: 'Revenue below break-even', detail: `At this revenue level your take-home (${fmt(monthlyTakeHome)}/mo) doesn't cover your expenses (${fmt(monthlyExpenses)}/mo). You need at least ${fmt((monthlyExpenses * 2))} gross/mo to break even.` });
  }

  return flags;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  const { profile } = useProfileStore();

  const defaultRevenue = profile?.expected_monthly_revenue ?? 0;
  const defaultExpenses = EXPENSE_DEFAULTS[profile?.business_type ?? 'other'] ?? 200;

  const [monthlyRevenue, setMonthlyRevenue] = useState(defaultRevenue);
  const [monthlyExpenses, setMonthlyExpenses] = useState(defaultExpenses);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Sync with profile once loaded
  useEffect(() => {
    if (profile?.expected_monthly_revenue) setMonthlyRevenue(profile.expected_monthly_revenue);
    if (profile?.business_type) setMonthlyExpenses(EXPENSE_DEFAULTS[profile.business_type] ?? 200);
  }, [profile?.expected_monthly_revenue, profile?.business_type]);

  // All calculations are deterministic — no API needed for live updates
  const taxes = useMemo(
    () => calculateTakeHome(monthlyRevenue * 12, monthlyExpenses * 12),
    [monthlyRevenue, monthlyExpenses],
  );

  const monthlyTakeHome = Math.max(0, taxes.estimatedTakeHome / 12 - monthlyExpenses);
  const quarterlyInstallment = taxes.totalTax / 4;
  const effectiveRate = monthlyRevenue > 0 ? 1 - (monthlyTakeHome / monthlyRevenue) : 0;
  const flags = useMemo(
    () => generateFlags(taxes, monthlyRevenue, monthlyExpenses, profile?.business_type ?? 'other'),
    [taxes, monthlyRevenue, monthlyExpenses, profile?.business_type],
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="page-title">Financial Snapshot</h1>
        <p className="page-subtitle">Your estimated monthly take-home, taxes, and what to watch for — updated live.</p>
      </div>

      {/* ── Hero card ── */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-brand-200 text-sm font-medium mb-1">Estimated monthly take-home</p>
            <div className="font-heading text-5xl font-bold tabular-nums">
              {fmt(monthlyTakeHome)}
            </div>
            <p className="text-brand-200 text-sm mt-1">
              {fmtPct(1 - effectiveRate)} of {fmt(monthlyRevenue)} revenue · effective rate {fmtPct(effectiveRate)}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <Wallet size={24} className="text-white" />
          </div>
        </div>

        {/* Waterfall bar */}
        <div className="bg-white/10 rounded-xl p-4">
          <WaterfallBar
            grossMonthly={monthlyRevenue}
            taxes={taxes}
            monthlyExpenses={monthlyExpenses}
          />
        </div>
      </div>

      {/* ── Inputs ── */}
      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-slate-900 text-sm">Adjust your numbers</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="revenue" className="label">Monthly revenue</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">$</span>
              <input
                id="revenue"
                type="number"
                min={0}
                inputMode="numeric"
                value={monthlyRevenue || ''}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
                placeholder="e.g. 3000"
                className="input pl-7"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{fmt(monthlyRevenue * 12)}/year</p>
          </div>
          <div>
            <label htmlFor="expenses" className="label">Monthly expenses</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">$</span>
              <input
                id="expenses"
                type="number"
                min={0}
                inputMode="numeric"
                value={monthlyExpenses || ''}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
                placeholder="e.g. 400"
                className="input pl-7"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              {EXPENSE_HINTS[profile?.business_type ?? 'other']}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Gross Revenue', value: fmt(monthlyRevenue), sub: `${fmt(monthlyRevenue * 12)}/year`, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Tax Burden', value: fmt(taxes.totalTax / 12), sub: `${fmtPct(taxes.effectiveTaxRate)} effective rate`, icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Business Expenses', value: fmt(monthlyExpenses), sub: `${fmt(monthlyExpenses * 12)}/year`, icon: PiggyBank, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Monthly Take-Home', value: fmt(monthlyTakeHome), sub: `${fmtPct(monthlyRevenue > 0 ? monthlyTakeHome / monthlyRevenue : 0)} of revenue`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((card) => (
          <div key={card.label} className="card p-5">
            <div className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ${card.bg} mb-3`}>
              <card.icon size={17} className={card.color} />
            </div>
            <p className="text-xs text-slate-500 font-medium">{card.label}</p>
            <p className="font-heading text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tax breakdown (expandable) ── */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBreakdown((b) => !b)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          aria-expanded={showBreakdown}
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-orange-50">
              <Calculator size={17} className="text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-heading font-semibold text-slate-900 text-sm">Detailed Tax Breakdown</p>
              <p className="text-xs text-slate-500">Federal + QC income tax, QPP, QPIP — 2026 rates</p>
            </div>
          </div>
          {showBreakdown ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {showBreakdown && (
          <div className="border-t border-slate-100">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'Gross Revenue',       value: monthlyRevenue,                note: '/month' },
                  { label: 'Business Expenses',   value: -monthlyExpenses,              note: '/month', dimmed: true },
                  { label: 'Net Business Income', value: taxes.netBusinessIncome / 12,  note: '/month', bold: true },
                  { label: 'Federal Income Tax',  value: -(taxes.federalTax / 12),      note: '/month', red: true },
                  { label: 'Quebec Income Tax',   value: -(taxes.quebecTax / 12),       note: '/month', red: true },
                  { label: 'QPP Contributions',   value: -(taxes.qpp / 12),             note: '/month', amber: true },
                  { label: 'QPIP Premium',        value: -(taxes.qpip / 12),            note: '/month', amber: true },
                  { label: 'Monthly Take-Home',   value: monthlyTakeHome,               note: '/month', bold: true, brand: true },
                ].map((row) => (
                  <tr
                    key={row.label}
                    className={`border-b border-slate-50 ${row.bold ? 'bg-slate-50' : ''}`}
                  >
                    <td className={`px-5 py-3 text-sm ${row.bold ? 'font-semibold text-slate-900' : row.dimmed ? 'text-slate-400' : 'text-slate-600'}`}>
                      {row.label}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums font-medium ${
                      row.brand ? 'text-brand-700 font-bold' :
                      row.red ? 'text-red-600' :
                      row.amber ? 'text-amber-600' :
                      row.bold ? 'text-slate-900 font-semibold' :
                      row.value < 0 ? 'text-slate-500' :
                      'text-slate-900'
                    }`}>
                      {fmt(row.value)}<span className="text-xs text-slate-400 font-normal">{row.note}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── QPP Shock ── */}
      {taxes.qpp > 0 && (
        <QPPShock qppMonthly={taxes.qpp / 12} income={taxes.netBusinessIncome} />
      )}

      {/* ── 12-month projection ── */}
      {monthlyRevenue > 0 && (
        <div className="card p-5">
          <ProjectionChart
            monthlyRevenue={monthlyRevenue}
            monthlyTakeHome={monthlyTakeHome}
          />
        </div>
      )}

      {/* ── Tax calendar (expandable) ── */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCalendar((c) => !c)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          aria-expanded={showCalendar}
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-blue-50">
              <Calendar size={17} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-heading font-semibold text-slate-900 text-sm">2026 Tax Calendar</p>
              <p className="text-xs text-slate-500">Installment dates and estimated amounts</p>
            </div>
          </div>
          {showCalendar ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {showCalendar && (
          <div className="border-t border-slate-100 p-5">
            <TaxCalendar quarterlyInstallment={quarterlyInstallment} />
          </div>
        )}
      </div>

      {/* ── Watch-out flags ── */}
      {flags.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-slate-900 text-sm">Watch-outs for your situation</h3>
          {flags.map((flag, i) => {
            const Icon = flag.icon;
            const styles = {
              warning: { card: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-600', title: 'text-amber-900', body: 'text-amber-800' },
              info:    { card: 'border-blue-200 bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   title: 'text-blue-900',  body: 'text-blue-800'  },
              tip:     { card: 'border-brand-200 bg-brand-50', icon: 'bg-brand-100 text-brand-600', title: 'text-brand-900', body: 'text-brand-800' },
            }[flag.type];
            return (
              <div key={i} className={`rounded-xl border ${styles.card} p-4 flex gap-3`}>
                <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${styles.icon} shrink-0 mt-0.5`}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${styles.title}`}>{flag.title}</p>
                  <p className={`text-sm ${styles.body} mt-0.5 leading-relaxed`}>{flag.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Link to funding ── */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-heading font-semibold text-slate-900 text-sm">See how funding changes your picture</p>
          <p className="text-xs text-slate-500 mt-0.5">Grants and loans could cover months of expenses while you grow.</p>
        </div>
        <Link href="/funding" className="btn-secondary btn-sm gap-1.5 shrink-0">
          View funding <ArrowRight size={13} />
        </Link>
      </div>

    </div>
  );
}
