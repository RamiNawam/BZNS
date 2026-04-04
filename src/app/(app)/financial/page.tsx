"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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
  Target,
  BarChart3,
  Receipt,
  Banknote,
  ChevronLeft,
  Edit3,
} from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { calculateTakeHome } from "@/lib/financial/tax-calculator";
import { getExpenseDefaults } from "@/lib/financial/expense-defaults";
import {
  generateScenarios,
  getBreakEvenResult,
  calculatePricing,
  calculateFundingImpact,
} from "@/lib/financial/projections";
import { getDeductionSummary } from "@/lib/financial/deductions";
import { getClusterQuestions } from "@/lib/financial/cluster-questions";
import type { FinancialQuestion } from "@/lib/financial/cluster-questions";
import { CLUSTERS, type ClusterID } from "@/lib/clusters";
import {
  FEDERAL_TAX_BRACKETS,
  QUEBEC_TAX_BRACKETS,
  FEDERAL_BASIC_PERSONAL_AMOUNT,
  QUEBEC_BASIC_PERSONAL_AMOUNT,
  type TaxBracket,
} from "@/lib/financial/constants";
import type { ExpenseCategory } from "@/lib/financial/expense-defaults";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const GST_THRESHOLD = 30_000;

// ── Page section headings (Layout A) ─────────────────────────────────────────

function PageSection({
  kicker,
  title,
  description,
  id,
}: {
  kicker: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div className="space-y-1 pt-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {kicker}
      </p>
      <h2 id={id} className="font-heading text-lg font-semibold text-slate-900">
        {title}
      </h2>
      {description ? (
        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}

// ── Section toggle wrapper ────────────────────────────────────────────────────

function Expandable({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  icon: typeof Calculator;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ${iconBg}`}
          >
            <Icon size={17} className={iconColor} />
          </div>
          <div className="text-left">
            <p className="font-heading font-semibold text-slate-900 text-sm">
              {title}
            </p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ZONE 1: THE SNAPSHOT — hero card + waterfall
// ══════════════════════════════════════════════════════════════════════════════

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
    {
      label: "Federal Tax",
      value: taxes.federalTax / 12,
      color: "bg-red-400",
      textColor: "text-red-600",
    },
    {
      label: "Quebec Tax",
      value: taxes.quebecTax / 12,
      color: "bg-orange-400",
      textColor: "text-orange-600",
    },
    {
      label: "QPP",
      value: taxes.qpp / 12,
      color: "bg-amber-400",
      textColor: "text-amber-600",
    },
    {
      label: "QPIP",
      value: taxes.qpip / 12,
      color: "bg-yellow-300",
      textColor: "text-yellow-600",
    },
    {
      label: "Expenses",
      value: monthlyExpenses,
      color: "bg-slate-300",
      textColor: "text-slate-500",
    },
    {
      label: "Take-home",
      value: Math.max(0, taxes.estimatedTakeHome - monthlyExpenses),
      color: "bg-brand-500",
      textColor: "text-brand-700",
    },
  ];
  const total = grossMonthly || 1;

  return (
    <div className="space-y-4">
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
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 min-w-0">
            <div className={`h-2.5 w-2.5 rounded-full ${s.color} shrink-0`} />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{s.label}</div>
              <div className={`text-xs font-bold tabular-nums ${s.textColor}`}>
                {fmt(s.value)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ZONE 2: THE BREAKDOWN — stat cards + expense donut + pricing slider
// ══════════════════════════════════════════════════════════════════════════════

// ── Expense breakdown donut (SVG) ────────────────────────────────────────────

const DONUT_COLORS = [
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#5eead4",
  "#99f6e4",
  "#ccfbf1",
  "#f59e0b",
  "#fbbf24",
  "#fcd34d",
];

function ExpenseDonut({
  categories,
  total,
}: {
  categories: ExpenseCategory[];
  total: number;
}) {
  const R = 60;
  const CX = 80;
  const CY = 80;
  const STROKE = 24;
  const circumference = 2 * Math.PI * R;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={160} height={160} viewBox="0 0 160 160" className="shrink-0">
        {/* Background ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={STROKE}
        />
        {categories.map((cat, i) => {
          const pct = total > 0 ? cat.amount / total : 0;
          const dashLen = pct * circumference;
          const dashOffset = -cumulative * circumference + circumference * 0.25; // start at top
          cumulative += pct;
          return (
            <circle
              key={cat.key}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={STROKE}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          );
        })}
        {/* Center text */}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          className="fill-slate-900 font-heading"
          fontSize="18"
          fontWeight="700"
        >
          {fmt(total)}
        </text>
        <text
          x={CX}
          y={CY + 12}
          textAnchor="middle"
          className="fill-slate-400"
          fontSize="10"
        >
          /month
        </text>
      </svg>
      {/* Legend */}
      <div className="space-y-1.5 min-w-0 flex-1">
        {categories.map((cat, i) => (
          <div key={cat.key} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-xs text-slate-600 truncate flex-1">
              {cat.label}
            </span>
            <span className="text-xs font-bold text-slate-700 tabular-nums">
              {fmt(cat.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pricing slider ───────────────────────────────────────────────────────────

function PricingSlider({
  monthlyExpenses,
  defaultPrice,
  defaultUnits,
}: {
  monthlyExpenses: number;
  defaultPrice: number;
  defaultUnits: number;
}) {
  const [price, setPrice] = useState(defaultPrice);
  const [units, setUnits] = useState(defaultUnits);

  const result = useMemo(
    () => calculatePricing(price, units, monthlyExpenses),
    [price, units, monthlyExpenses],
  );

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Price per unit / hour</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              $
            </span>
            <input
              type="number"
              min={0}
              value={price || ""}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="input pl-7"
            />
          </div>
          <input
            type="range"
            min={5}
            max={500}
            step={5}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full mt-2 accent-brand-600"
          />
        </div>
        <div>
          <label className="label">Units / hours per month</label>
          <input
            type="number"
            min={0}
            value={units || ""}
            onChange={(e) => setUnits(Number(e.target.value) || 0)}
            className="input"
          />
          <input
            type="range"
            min={1}
            max={200}
            step={1}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full mt-2 accent-brand-600"
          />
        </div>
      </div>

      {/* Result */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">
            Gross Revenue
          </div>
          <div className="font-heading font-bold text-slate-900 text-lg tabular-nums mt-1">
            {fmt(result.grossMonthlyRevenue)}
          </div>
          <div className="text-[10px] text-slate-400">/month</div>
        </div>
        <div className="bg-brand-50 rounded-xl p-3 text-center border border-brand-200">
          <div className="text-[10px] text-brand-700 uppercase font-medium tracking-wide">
            You Keep
          </div>
          <div className="font-heading font-bold text-brand-700 text-lg tabular-nums mt-1">
            {fmt(result.monthlyTakeHome)}
          </div>
          <div className="text-[10px] text-brand-500">/month</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
          <div className="text-[10px] text-amber-700 uppercase font-medium tracking-wide">
            Per Unit Profit
          </div>
          <div className="font-heading font-bold text-amber-700 text-lg tabular-nums mt-1">
            {fmt(result.perUnitTakeHome)}
          </div>
          <div className="text-[10px] text-amber-500">after tax</div>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Charging <strong className="text-slate-600">{fmt(price + 5)}</strong>{" "}
        instead adds{" "}
        <strong className="text-brand-600">{fmt(5 * units * 0.65)}</strong>
        /month to your take-home (approx).
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAX BRACKET BAR — visual "you are here" indicator
// ══════════════════════════════════════════════════════════════════════════════

function fmtK(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

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
  const lastBracketMin = brackets[brackets.length - 1].min;
  const visualMax = Math.max(lastBracketMin * 1.15, income * 1.1, 80000);

  let activeBracketIdx = 0;
  for (let i = 0; i < brackets.length; i++) {
    if (income > brackets[i].min) activeBracketIdx = i;
  }

  const markerPct = Math.min((income / visualMax) * 100, 98);

  const colors = [
    "bg-teal-100",
    "bg-teal-200",
    "bg-amber-200",
    "bg-amber-300",
    "bg-red-300",
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs text-slate-500">
          Taxable:{" "}
          <span className="font-semibold text-slate-700 tabular-nums">
            {fmt(income)}
          </span>
        </span>
      </div>

      <div className="relative">
        <div className="flex h-5 rounded-md overflow-hidden">
          {brackets.map((b, i) => {
            const start = b.min;
            const end = b.max ?? visualMax;
            const width =
              ((Math.min(end, visualMax) - start) / visualMax) * 100;
            const isActive = i === activeBracketIdx && income > 0;
            return (
              <div
                key={i}
                className={`${colors[i] ?? "bg-red-400"} relative flex items-center justify-center transition-all
                  ${isActive ? "ring-1 ring-inset ring-slate-900/20" : ""}
                  ${i < brackets.length - 1 ? "border-r border-white/60" : ""}`}
                style={{ width: `${Math.max(width, 2)}%` }}
                title={`${fmtK(start)}${b.max ? `–${fmtK(b.max)}` : "+"} → ${(b.rate * 100).toFixed(1)}%`}
              >
                <span className="text-[9px] font-medium text-slate-700/80 truncate px-0.5 select-none">
                  {(b.rate * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

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

      <div className="flex text-[9px] text-slate-400 tabular-nums">
        {brackets.map((b, i) => {
          const end = b.max ?? visualMax;
          const width = ((Math.min(end, visualMax) - b.min) / visualMax) * 100;
          return (
            <div
              key={i}
              style={{ width: `${Math.max(width, 2)}%` }}
              className="truncate px-0.5"
            >
              {fmtK(b.min)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTION CHART (SVG) — existing, preserved
// ══════════════════════════════════════════════════════════════════════════════

function ProjectionChart({
  monthlyRevenue,
  monthlyTakeHome,
}: {
  monthlyRevenue: number;
  monthlyTakeHome: number;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const revData = months.map((m) => monthlyRevenue * m);
  const thData = months.map((m) => Math.max(0, monthlyTakeHome) * m);
  const maxY = Math.max(...revData, GST_THRESHOLD * 1.15, 1000);

  const W = 560;
  const H = 180;
  const PL = 48;
  const PR = 16;
  const PT = 12;
  const PB = 28;
  const iW = W - PL - PR;
  const iH = H - PT - PB;
  const xS = (m: number) => PL + ((m - 1) / 11) * iW;
  const yS = (v: number) => PT + iH - (v / maxY) * iH;

  const revPath = revData
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${xS(i + 1).toFixed(1)} ${yS(v).toFixed(1)}`,
    )
    .join(" ");
  const thPath = thData
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${xS(i + 1).toFixed(1)} ${yS(v).toFixed(1)}`,
    )
    .join(" ");
  const gstY = yS(GST_THRESHOLD);
  const crossMonth = months.find((m) => monthlyRevenue * m >= GST_THRESHOLD);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    v: maxY * p,
    y: yS(maxY * p),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-slate-900 text-sm">
          12-Month Projection
        </h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-0.5 w-4 bg-brand-500 rounded" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className="inline-block h-0.5 w-4 bg-emerald-400 rounded"
              style={{ borderTop: "2px dashed #34d399" }}
            />
            Take-home
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-red-400" />
            GST limit
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="12-month projection"
      >
        {yTicks.map(({ v, y }) => (
          <g key={v}>
            <line
              x1={PL}
              y1={y}
              x2={W - PR}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <text
              x={PL - 4}
              y={y + 4}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="9"
            >
              {v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`}
            </text>
          </g>
        ))}
        {gstY > PT && gstY < PT + iH && (
          <>
            <line
              x1={PL}
              y1={gstY}
              x2={W - PR}
              y2={gstY}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="5,3"
              opacity="0.7"
            />
            <text
              x={W - PR - 2}
              y={gstY - 3}
              textAnchor="end"
              fill="#ef4444"
              fontSize="9"
              opacity="0.85"
            >
              $30K GST/QST
            </text>
          </>
        )}
        <path
          d={revPath}
          fill="none"
          stroke="#0d9488"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={thPath}
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6,3"
        />
        {revData.map((v, i) => (
          <circle key={i} cx={xS(i + 1)} cy={yS(v)} r="2.5" fill="#0d9488" />
        ))}
        {months
          .filter((_, i) => i % 2 === 0)
          .map((m) => (
            <text
              key={m}
              x={xS(m)}
              y={H - 6}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
            >
              {MONTH_LABELS[m - 1]}
            </text>
          ))}
      </svg>
      {crossMonth && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertTriangle size={12} className="shrink-0" />
          You&apos;ll cross the $30,000 GST/QST threshold in{" "}
          <strong className="mx-0.5">month {crossMonth}</strong> — register
          before then.
        </div>
      )}
      {!crossMonth && monthlyRevenue > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <Info size={12} className="shrink-0" />
          At this revenue level you stay under the $30,000 threshold — no
          GST/QST registration required this year.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAX CALENDAR — existing, preserved
// ══════════════════════════════════════════════════════════════════════════════

function TaxCalendar({
  quarterlyInstallment,
}: {
  quarterlyInstallment: number;
}) {
  const events = [
    {
      date: "Mar 15",
      label: "1st Installment",
      amount: quarterlyInstallment,
      color: "bg-amber-500",
    },
    { date: "Apr 30", label: "Balance due", amount: null, color: "bg-red-500" },
    {
      date: "Jun 15",
      label: "2nd Install. + Return",
      amount: quarterlyInstallment,
      color: "bg-amber-500",
    },
    {
      date: "Sep 15",
      label: "3rd Installment",
      amount: quarterlyInstallment,
      color: "bg-amber-500",
    },
    {
      date: "Dec 15",
      label: "4th Installment",
      amount: quarterlyInstallment,
      color: "bg-amber-500",
    },
  ];
  return (
    <div className="p-5">
      <h3 className="font-heading font-semibold text-slate-900 text-sm mb-5">
        2026 Tax Calendar
      </h3>
      <div className="relative">
        <div className="absolute top-3.5 left-4 right-4 h-px bg-slate-200" />
        <div className="relative flex justify-between items-start">
          {events.map((e, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`h-7 w-7 rounded-full ${e.color} flex items-center justify-center z-10 shadow-sm shrink-0`}
              >
                <Calendar size={12} className="text-white" />
              </div>
              <div className="text-center px-0.5">
                <div className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                  {e.date}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5 text-center">
                  {e.label}
                </div>
                {e.amount != null && e.amount > 0 && (
                  <div className="text-[10px] font-bold text-amber-700 tabular-nums mt-0.5">
                    {fmt(e.amount)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        * Installments required when total tax &gt; $1,800/year. Self-employed
        filing deadline is June 15, but any balance owed is due April 30.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QPP SHOCK EXPLAINER — existing, preserved
// ══════════════════════════════════════════════════════════════════════════════

function QPPShock({ qppMonthly }: { qppMonthly: number }) {
  const employeeEquiv = qppMonthly / 2;
  return (
    <div className="card-brand rounded-xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-heading font-semibold text-slate-900 text-sm">
            The QPP Double Contribution
          </h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            As a self-employed person, you pay <strong>both</strong> the
            employee AND employer share of QPP. An employee at the same income
            would pay only {fmt(employeeEquiv)}/mo — you pay{" "}
            <strong className="text-amber-700">{fmt(qppMonthly)}/mo</strong>.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">
            Employee at same income
          </div>
          <div className="font-heading font-bold text-slate-700 tabular-nums">
            {fmt(employeeEquiv)}
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
          <div className="text-xs text-amber-700 mb-1">You (self-employed)</div>
          <div className="font-heading font-bold text-amber-700 tabular-nums">
            {fmt(qppMonthly)}
            <span className="text-xs font-normal text-amber-500">/mo</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        The good news: half of your QPP is tax-deductible, reducing your taxable
        income.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO COMPARISON — 3 side-by-side revenue scenarios
// ══════════════════════════════════════════════════════════════════════════════

function ScenarioComparison({
  monthlyRevenue,
  monthlyExpenses,
}: {
  monthlyRevenue: number;
  monthlyExpenses: number;
}) {
  const scenarios = useMemo(
    () => generateScenarios(monthlyRevenue, monthlyExpenses),
    [monthlyRevenue, monthlyExpenses],
  );
  const colStyles = [
    "border-slate-200 bg-white",
    "border-brand-300 bg-brand-50 ring-2 ring-brand-200",
    "border-emerald-200 bg-emerald-50",
  ];

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((s, i) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 text-center ${colStyles[i]}`}
          >
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              {s.label}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {fmt(s.monthlyRevenue)}/mo
            </div>
            <div className="font-heading text-2xl font-bold text-slate-900 tabular-nums mt-2">
              {fmt(s.monthlyTakeHome)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">take-home/mo</div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Tax burden</span>
                <span className="text-red-600 font-medium">
                  {fmt(s.taxes.total_deductions / 12)}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Keep rate</span>
                <span className="text-brand-700 font-medium">
                  {fmtPct(s.effectiveKeepRate)}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">GST req?</span>
                <span
                  className={
                    s.gstRequired
                      ? "text-red-600 font-medium"
                      : "text-emerald-600 font-medium"
                  }
                >
                  {s.gstRequired ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 text-center">
        Based on 70% / 100% / 140% of your expected {fmt(monthlyRevenue)}/month
        revenue
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BREAK-EVEN INDICATOR
// ══════════════════════════════════════════════════════════════════════════════

function BreakEvenCard({
  monthlyRevenue,
  monthlyExpenses,
}: {
  monthlyRevenue: number;
  monthlyExpenses: number;
}) {
  const result = useMemo(
    () => getBreakEvenResult(monthlyRevenue, monthlyExpenses),
    [monthlyRevenue, monthlyExpenses],
  );

  const progressPct =
    result.breakEvenMonthlyRevenue > 0
      ? Math.min(100, (monthlyRevenue / result.breakEvenMonthlyRevenue) * 100)
      : 100;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-violet-50">
          <Target size={17} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-slate-900 text-sm">
            Break-Even
          </h3>
          <p className="text-xs text-slate-500">
            Minimum revenue to cover expenses + all taxes
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-400">You need at least</div>
          <div className="font-heading text-xl font-bold text-slate-900 tabular-nums">
            {fmt(result.breakEvenMonthlyRevenue)}
            <span className="text-sm font-normal text-slate-400">/mo</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Your projection</div>
          <div
            className={`font-heading text-xl font-bold tabular-nums ${result.isAboveBreakEven ? "text-emerald-600" : "text-red-600"}`}
          >
            {fmt(monthlyRevenue)}
            <span className="text-sm font-normal text-slate-400">/mo</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${result.isAboveBreakEven ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${progressPct}%` }}
        />
        {/* Break-even marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-900"
          style={{ left: "100%", transform: "translateX(-1px)" }}
        />
      </div>

      {result.isAboveBreakEven ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
          You&apos;re <strong>{fmt(result.surplus)}</strong>/mo above break-even
          — healthy margin.
        </p>
      ) : result.monthsToBreakEven !== null ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
          At 10% monthly growth, you could reach break-even in ~
          <strong>{result.monthsToBreakEven} months</strong>. Focus on building
          revenue above {fmt(result.breakEvenMonthlyRevenue)}/mo.
        </p>
      ) : (
        <p className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          You&apos;re {fmt(Math.abs(result.surplus))}/mo below break-even.
          Consider reducing expenses or increasing prices.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEDUCTION TRACKER
// ══════════════════════════════════════════════════════════════════════════════

function DeductionTracker({ clusterId }: { clusterId: ClusterID }) {
  const summary = useMemo(() => getDeductionSummary(clusterId), [clusterId]);

  return (
    <div className="p-5 space-y-4">
      {/* Savings headline */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-center justify-between">
        <div>
          <div className="text-xs text-emerald-600 font-medium">
            Estimated annual tax savings
          </div>
          <div className="font-heading text-2xl font-bold text-emerald-700 tabular-nums">
            {fmt(summary.estimatedTaxSavings)}
          </div>
          <div className="text-[10px] text-emerald-500">
            from {fmt(summary.totalAnnualDeductions)} in deductions at ~
            {fmtPct(summary.marginalRateUsed)} marginal rate
          </div>
        </div>
        <div className="font-heading text-4xl font-bold text-emerald-200">
          {fmt(summary.estimatedTaxSavings / 12)}
          <span className="text-sm font-normal">/mo</span>
        </div>
      </div>

      {/* Deduction list */}
      <div className="space-y-2">
        {summary.deductions.map((d) => (
          <div
            key={d.key}
            className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">{d.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Source: {d.source}
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className="text-sm font-bold text-slate-900 tabular-nums">
                {fmt(d.annualAmount)}
              </div>
              <div className="text-[10px] text-emerald-600">
                saves ~{fmt(d.annualAmount * summary.marginalRateUsed)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FUNDING IMPACT SECTION
// ══════════════════════════════════════════════════════════════════════════════

function FundingImpactCard({
  monthlyExpenses,
  monthlyTakeHome,
}: {
  monthlyExpenses: number;
  monthlyTakeHome: number;
}) {
  // Placeholder — in production this would fetch from the funding store
  const estimatedFunding = 95000;
  const impact = useMemo(
    () =>
      calculateFundingImpact(
        estimatedFunding,
        monthlyExpenses,
        monthlyTakeHome,
      ),
    [monthlyExpenses, monthlyTakeHome],
  );

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-50">
          <Banknote size={17} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-slate-900 text-sm">
            Funding Impact
          </h3>
          <p className="text-xs text-slate-500">
            How matched funding extends your runway
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
          <div className="text-[10px] text-emerald-600 uppercase font-medium tracking-wide">
            Available
          </div>
          <div className="font-heading text-xl font-bold text-emerald-700 tabular-nums mt-1">
            {fmt(impact.totalFundingAvailable)}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">
            Covers Expenses
          </div>
          <div className="font-heading text-xl font-bold text-slate-900 tabular-nums mt-1">
            {impact.monthsOfRunway}
            <span className="text-xs font-normal text-slate-400"> months</span>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">
            Full Income
          </div>
          <div className="font-heading text-xl font-bold text-slate-900 tabular-nums mt-1">
            {impact.monthsOfFullIncome}
            <span className="text-xs font-normal text-slate-400"> months</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        {impact.effectiveRunwayMessage}
      </p>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Based on your matched funding programs
        </p>
        <Link href="/funding" className="btn-secondary btn-sm gap-1.5 shrink-0">
          View matches <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DETERMINISTIC WATCH-OUT FLAGS — existing logic, preserved
// ══════════════════════════════════════════════════════════════════════════════

function generateFlags(
  taxes: ReturnType<typeof calculateTakeHome>,
  monthlyRevenue: number,
  monthlyExpenses: number,
  businessType: string,
) {
  const flags: {
    type: "warning" | "info" | "tip";
    icon: typeof AlertTriangle;
    title: string;
    detail: string;
  }[] = [];
  const annualRevenue = monthlyRevenue * 12;
  const monthlyTakeHome = Math.max(
    0,
    taxes.estimatedTakeHome - monthlyExpenses,
  );
  const totalTax = taxes.totalTax;

  if (annualRevenue >= 25000 && annualRevenue < 30000) {
    flags.push({
      type: "warning",
      icon: AlertTriangle,
      title: "Approaching GST/QST threshold",
      detail: `You're ${fmt(30000 - annualRevenue)} away from the $30,000 registration threshold. Plan to register before you cross it to avoid penalties.`,
    });
  } else if (annualRevenue >= 30000) {
    flags.push({
      type: "warning",
      icon: AlertTriangle,
      title: "GST/QST registration required",
      detail: `At $${(annualRevenue / 1000).toFixed(0)}K/year, you must register for GST/QST within 30 days of crossing the threshold and start collecting sales tax.`,
    });
  }

  if (totalTax > 1800) {
    const installment = totalTax / 4;
    flags.push({
      type: "info",
      icon: Info,
      title: "Quarterly tax installments apply",
      detail: `Your estimated tax (${fmt(totalTax)}/yr) exceeds $1,800 — you must pay ${fmt(installment)} quarterly starting March 15. Set this aside monthly.`,
    });
  }

  flags.push({
    type: "warning",
    icon: AlertTriangle,
    title: "Budget for QPP — most first-timers miss this",
    detail: `QPP costs self-employed people 12.8% of net income (both shares). That's ${fmt(taxes.qpp / 12)}/month you need to set aside — it's not deducted automatically.`,
  });

  if (businessType === "food") {
    flags.push({
      type: "tip",
      icon: Lightbulb,
      title: "Track mileage to markets",
      detail:
        "Driving to farmers markets, ingredient shopping, and deliveries is deductible. At the 2026 rate of $0.72/km, 200km/month = $144 in deductions — about $36 in tax savings.",
    });
  } else if (businessType === "freelance" || businessType === "tech") {
    flags.push({
      type: "tip",
      icon: Lightbulb,
      title: "Home office deduction available",
      detail:
        "If you work from home, you can deduct a proportional share of rent, utilities, and internet. A 10m² office in a 100m² home = 10% of housing costs deductible.",
    });
  } else if (businessType === "daycare") {
    flags.push({
      type: "tip",
      icon: Lightbulb,
      title: "STA income support during startup",
      detail:
        "The Service de garde en milieu familial STA program provides income support while you build up your enrollment. Apply through your RCE before opening.",
    });
  }

  if (monthlyTakeHome < monthlyExpenses) {
    flags.push({
      type: "warning",
      icon: AlertTriangle,
      title: "Revenue below break-even",
      detail: `At this revenue level your take-home (${fmt(monthlyTakeHome)}/mo) doesn't cover your expenses (${fmt(monthlyExpenses)}/mo). You need at least ${fmt(monthlyExpenses * 2)} gross/mo to break even.`,
    });
  }

  return flags;
}

// ══════════════════════════════════════════════════════════════════════════════
// CLUSTER FINANCIAL QUESTIONNAIRE — gate shown before the dashboard
// ══════════════════════════════════════════════════════════════════════════════

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: FinancialQuestion;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  if (question.type === "boolean") {
    const opts = question.options ?? [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ];
    // Normalise value: true/false booleans → 'true'/'false' strings
    const strVal =
      value === true ? "true" : value === false ? "false" : String(value);
    return (
      <div className="grid grid-cols-2 gap-3">
        {opts.map((opt) => {
          const isSelected = strVal === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-semibold text-slate-900">
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "select" && question.options) {
    return (
      <div className="grid grid-cols-1 gap-2">
        {question.options.map((opt) => {
          const isSelected = String(value) === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  isSelected
                    ? "border-brand-500 bg-brand-500"
                    : "border-slate-300"
                }`}
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-900">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // currency or number
  return (
    <div className="relative">
      {question.type === "currency" && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium pointer-events-none">
          $
        </span>
      )}
      <input
        type="number"
        min={question.min ?? 0}
        max={question.max}
        step={question.step ?? (question.type === "currency" ? 1 : 1)}
        value={(value as number) || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={String(question.defaultValue)}
        className={`w-full border border-slate-200 rounded-xl py-4 text-lg font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition ${
          question.type === "currency" ? "pl-9 pr-4" : "px-4"
        }`}
      />
      {question.suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
          {question.suffix}
        </span>
      )}
    </div>
  );
}

function FinancialQuestionnaire({
  clusterId,
  clusterLabel,
  initialAnswers,
  onComplete,
}: {
  clusterId: ClusterID;
  clusterLabel: string;
  initialAnswers?: Record<string, string | number | boolean>;
  onComplete: (answers: Record<string, string | number | boolean>) => void;
}) {
  const questionSet = useMemo(
    () => getClusterQuestions(clusterId),
    [clusterId],
  );
  const questions = questionSet.questions;

  // Initialize answers with default values
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, string | number | boolean>
  >(() => {
    const init: Record<string, string | number | boolean> = {};
    questions.forEach((q) => {
      init[q.key] =
        q.defaultValue ??
        (q.type === "currency" || q.type === "number" ? 0 : "");
    });
    return { ...init, ...(initialAnswers ?? {}) };
  });

  const question = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const isFirst = currentStep === 0;

  const handleChange = useCallback(
    (v: string | number | boolean) => {
      setAnswers((prev) => ({ ...prev, [question.key]: v }));
    },
    [question.key],
  );

  const handleNext = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  const currentValue = answers[question.key];

  return (
    <div className="max-w-4xl mx-auto pt-4 pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 mb-3">
          <Calculator size={12} />
          Your business type: <strong>{clusterLabel}</strong>
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          {questionSet.title}
        </h1>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">
          {questionSet.description}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => i < currentStep && setCurrentStep(i)}
            className={`transition-all duration-300 rounded-full ${
              i === currentStep
                ? "h-2.5 w-8 bg-brand-500"
                : i < currentStep
                  ? "h-2 w-2 bg-brand-300 cursor-pointer"
                  : "h-2 w-2 bg-slate-200 cursor-default"
            }`}
            aria-label={`Question ${i + 1}`}
            disabled={i > currentStep}
          />
        ))}
        <span className="ml-2 text-xs text-slate-400">
          {currentStep + 1} of {questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-brand-50 shrink-0">
            <Calculator size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-slate-900 text-base leading-snug">
              {question.label}
            </h2>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">
              {question.description}
            </p>
          </div>
        </div>

        <QuestionInput
          question={question}
          value={currentValue}
          onChange={handleChange}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirst}
          className={`flex items-center gap-1.5 text-sm font-medium rounded-xl px-4 py-2.5 transition-all ${
            isFirst
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-all shadow-sm hover:shadow-md"
        >
          {isLast ? (
            <>
              Calculate my finances
              <ArrowRight size={16} />
            </>
          ) : (
            <>
              Next
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* Skip link */}
      <p className="text-center mt-4">
        <button
          type="button"
          onClick={() => onComplete(answers)}
          className="text-xs text-slate-400 hover:text-slate-600 underline-offset-2 hover:underline transition-colors"
        >
          Skip and use default estimates
        </button>
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE — assembles all zones
// ══════════════════════════════════════════════════════════════════════════════

export default function FinancialPage() {
  const { profile, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Scroll to hash section when navigating from sidebar dropdown
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timeout = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  // Cluster-aware defaults
  const clusterId = (profile?.cluster_id ?? "C2") as ClusterID;
  const expenseProfile = useMemo(
    () => getExpenseDefaults(clusterId),
    [clusterId],
  );
  const questionSet = useMemo(
    () => getClusterQuestions(clusterId),
    [clusterId],
  );

  // ── All state declarations first ─────────────────────────────────────────
  const defaultRevenue = profile?.expected_monthly_revenue ?? 0;
  const [monthlyRevenue, setMonthlyRevenue] = useState(defaultRevenue);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
    expenseProfile.categories,
  );
  const [questionnaireComplete, setQuestionnaireComplete] = useState(false);
  const [isEditingInputs, setIsEditingInputs] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<
    Record<string, string | number | boolean>
  >({});
  const [isSubmittingQuestionnaire, setIsSubmittingQuestionnaire] =
    useState(false);

  // Called when user finishes (or skips) the questionnaire
  const handleQuestionnaireComplete = useCallback(
    async (answers: Record<string, string | number | boolean>) => {
      if (!profile?.id) return;
      setIsSubmittingQuestionnaire(true);
      const normalizedAnswers = Object.fromEntries(
        Object.entries(answers).map(([k, v]) => {
          if (v === "true") return [k, true];
          if (v === "false") return [k, false];
          return [k, v];
        }),
      ) as Record<string, string | number | boolean>;

      // Apply computed revenue + expense overrides in UI immediately
      const computed = questionSet.computeFinancials(normalizedAnswers);
      setMonthlyRevenue(computed.monthlyRevenue);
      setExpenseCategories((prev) =>
        prev.map((cat) =>
          computed.expenseOverrides[cat.key] !== undefined
            ? { ...cat, amount: computed.expenseOverrides[cat.key] }
            : cat,
        ),
      );

      try {
        await fetch("/api/financial-snapshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile_id: profile.id,
            questionnaire_answers: normalizedAnswers,
          }),
        });
        await loadProfile();
        setQuestionnaireAnswers(normalizedAnswers);
        setIsEditingInputs(false);
        setQuestionnaireComplete(true);
      } finally {
        setIsSubmittingQuestionnaire(false);
      }
    },
    [profile?.id, questionSet, loadProfile],
  );

  const handleResetQuestionnaire = () => {
    setIsEditingInputs(true);
    setQuestionnaireComplete(false);
  };

  const monthlyExpenses = expenseCategories.reduce(
    (sum, c) => sum + c.amount,
    0,
  );

  // Sync with profile once loaded
  useEffect(() => {
    if (!profile) return;
    if (isEditingInputs) return;
    const existingAnswers = profile.financial_questionnaire_answers ?? null;
    if (profile.financial_questionnaire_completed && existingAnswers) {
      const computed = questionSet.computeFinancials(existingAnswers);
      setQuestionnaireAnswers(existingAnswers);
      setMonthlyRevenue(
        profile.expected_monthly_revenue ?? computed.monthlyRevenue,
      );
      setExpenseCategories(
        expenseProfile.categories.map((cat) => ({
          ...cat,
          amount:
            profile.expense_categories?.[cat.key] ??
            computed.expenseOverrides[cat.key] ??
            cat.amount,
        })),
      );
      setQuestionnaireComplete(true);
      return;
    }
    setExpenseCategories(expenseProfile.categories);
    setQuestionnaireComplete(false);
  }, [profile, expenseProfile, questionSet, isEditingInputs]);

  // All calculations are deterministic — no API needed for live updates
  const businessStructure =
    profile?.business_structure ?? "sole_proprietorship";
  const taxes = useMemo(
    () =>
      calculateTakeHome(
        monthlyRevenue * 12,
        monthlyExpenses * 12,
        businessStructure,
      ),
    [monthlyRevenue, monthlyExpenses, businessStructure],
  );

  // estimatedTakeHome is already monthly and net of expenses
  const monthlyTakeHome = Math.max(0, taxes.estimatedTakeHome);
  const quarterlyInstallment = taxes.totalTax / 4;
  const effectiveRate =
    monthlyRevenue > 0 ? 1 - monthlyTakeHome / monthlyRevenue : 0;

  const flags = useMemo(
    () =>
      generateFlags(
        taxes,
        monthlyRevenue,
        monthlyExpenses,
        profile?.business_type ?? "other",
      ),
    [taxes, monthlyRevenue, monthlyExpenses, profile?.business_type],
  );

  // ── Update a single expense category amount ─────────────────
  const updateExpense = (key: string, newAmount: number) => {
    setExpenseCategories((prev) =>
      prev.map((c) =>
        c.key === key ? { ...c, amount: Math.max(0, newAmount) } : c,
      ),
    );
  };

  // ── Gate: show questionnaire until complete ──────────────────────────────
  if (!questionnaireComplete) {
    return (
      <div>
        <FinancialQuestionnaire
          clusterId={clusterId}
          clusterLabel={CLUSTERS[clusterId]?.label ?? "General micro-business"}
          initialAnswers={questionnaireAnswers}
          onComplete={handleQuestionnaireComplete}
        />
        {isSubmittingQuestionnaire && (
          <p className="text-center text-sm text-slate-500 -mt-6">
            Saving your financial setup...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Financial Snapshot</h1>
          <p className="page-subtitle">
            Your personal CFO dashboard — estimated taxes, take-home, and what
            to watch for. Updated live.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-3 py-1">
            <Calculator size={11} />
            Business type:{" "}
            <strong className="ml-0.5">
              {CLUSTERS[clusterId]?.label ?? "General micro-business"}
            </strong>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetQuestionnaire}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-700 border border-slate-200 hover:border-brand-300 rounded-lg px-3 py-1.5 transition-all shrink-0 mt-1"
          title="Re-answer the setup questions"
        >
          <Edit3 size={12} />
          Edit inputs
        </button>
      </div>

      {/* ── 1. Financial insight ─────────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="fin-section-insight">
        <PageSection
          kicker="1 · Financial insight"
          title="Your money story"
          description="Estimated take-home after taxes and expenses, with a quick visual of where each dollar goes."
          id="fin-section-insight"
        />
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-lg shadow-brand-900/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-brand-200 text-sm font-medium mb-1">
                Estimated monthly take-home
              </p>
              <div className="font-heading text-5xl font-bold tabular-nums">
                {fmt(monthlyTakeHome)}
              </div>
              <p className="text-brand-200 text-sm mt-1">
                {fmtPct(1 - effectiveRate)} of {fmt(monthlyRevenue)} revenue ·
                effective rate {fmtPct(effectiveRate)}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <Wallet size={24} className="text-white" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <WaterfallBar
              grossMonthly={monthlyRevenue}
              taxes={taxes}
              monthlyExpenses={monthlyExpenses}
            />
          </div>
        </div>
      </section>

      {/* ── 2. Numbers ────────────────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="fin-section-glance">
        <PageSection
          kicker="2 · Numbers"
          title="Key numbers"
          description="Revenue, tax load, expenses, and what you keep — all on one row."
          id="fin-section-glance"
        />
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Gross Revenue",
              value: fmt(monthlyRevenue),
              sub: `${fmt(monthlyRevenue * 12)}/year`,
              icon: TrendingUp,
              color: "text-brand-600",
              bg: "bg-brand-50",
            },
            {
              label: "Tax Burden",
              value: fmt(taxes.totalTax / 12),
              sub: `${fmtPct(taxes.effectiveTaxRate)} effective rate`,
              icon: DollarSign,
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              label: "Business Expenses",
              value: fmt(monthlyExpenses),
              sub: `${fmt(monthlyExpenses * 12)}/year`,
              icon: PiggyBank,
              color: "text-slate-600",
              bg: "bg-slate-100",
            },
            {
              label: "Monthly Take-Home",
              value: fmt(monthlyTakeHome),
              sub: `${fmtPct(monthlyRevenue > 0 ? monthlyTakeHome / monthlyRevenue : 0)} of revenue`,
              icon: Wallet,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
          ].map((card) => (
            <div key={card.label} className="card p-5">
              <div
                className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ${card.bg} mb-3`}
              >
                <card.icon size={17} className={card.color} />
              </div>
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              <p className="font-heading text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                {card.value}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Tax section ────────────────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="fin-section-tax">
        <PageSection
          kicker="3 · Taxes"
          title="Tax breakdown"
          description="Federal and Québec income tax, QPP, and QPIP — estimated from your net business income (2026 assumptions)."
          id="fin-section-tax"
        />
        <Expandable
          icon={Calculator}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          title="Detailed tax breakdown"
          subtitle="Federal + QC income tax, QPP, QPIP — 2026 rates"
          defaultOpen
        >
          <table className="w-full text-sm">
            <tbody>
              {[
                {
                  label: "Gross Revenue",
                  value: monthlyRevenue,
                  note: "/month",
                },
                {
                  label: "Business Expenses",
                  value: -monthlyExpenses,
                  note: "/month",
                  dimmed: true,
                },
                {
                  label: "Net Business Income",
                  value: taxes.netBusinessIncome / 12,
                  note: "/month",
                  bold: true,
                },
                {
                  label: "Federal Income Tax",
                  value: -(taxes.federalTax / 12),
                  note: "/month",
                  red: true,
                },
                {
                  label: "Quebec Income Tax",
                  value: -(taxes.quebecTax / 12),
                  note: "/month",
                  red: true,
                },
                {
                  label: "QPP Contributions",
                  value: -(taxes.qpp / 12),
                  note: "/month",
                  amber: true,
                },
                {
                  label: "QPIP Premium",
                  value: -(taxes.qpip / 12),
                  note: "/month",
                  amber: true,
                },
                {
                  label: "Monthly Take-Home",
                  value: monthlyTakeHome,
                  note: "/month",
                  bold: true,
                  brand: true,
                },
              ].map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-slate-50 ${row.bold ? "bg-slate-50" : ""}`}
                >
                  <td
                    className={`px-5 py-3 text-sm ${row.bold ? "font-semibold text-slate-900" : row.dimmed ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`px-5 py-3 text-right tabular-nums font-medium ${
                      row.brand
                        ? "text-brand-700 font-bold"
                        : row.red
                          ? "text-red-600"
                          : row.amber
                            ? "text-amber-600"
                            : row.bold
                              ? "text-slate-900 font-semibold"
                              : row.value < 0
                                ? "text-slate-500"
                                : "text-slate-900"
                    }`}
                  >
                    {fmt(row.value)}
                    <span className="text-xs text-slate-400 font-normal">
                      {row.note}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Expandable>

        {/* Tax Bracket Bars */}
        {taxes.netBusinessIncome > 0 && (
          <div className="card p-5 space-y-5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Your Tax Brackets
            </h3>
            <TaxBracketBar
              brackets={FEDERAL_TAX_BRACKETS}
              income={Math.max(
                0,
                taxes.netBusinessIncome - FEDERAL_BASIC_PERSONAL_AMOUNT,
              )}
              personalAmount={FEDERAL_BASIC_PERSONAL_AMOUNT}
              label="Federal"
            />
            <TaxBracketBar
              brackets={QUEBEC_TAX_BRACKETS}
              income={Math.max(
                0,
                taxes.netBusinessIncome - QUEBEC_BASIC_PERSONAL_AMOUNT,
              )}
              personalAmount={QUEBEC_BASIC_PERSONAL_AMOUNT}
              label="Québec"
            />
            <p className="text-[10px] text-slate-400">
              Taxable income = net revenue minus personal amount (
              {fmtK(FEDERAL_BASIC_PERSONAL_AMOUNT)} federal,{" "}
              {fmtK(QUEBEC_BASIC_PERSONAL_AMOUNT)} QC)
            </p>
          </div>
        )}

        {taxes.qpp > 0 && <QPPShock qppMonthly={taxes.qpp / 12} />}
      </section>

      {/* ── 4. Charts & outlook ──────────────────────────────────────────── */}
      {monthlyRevenue > 0 && (
        <section className="space-y-3" aria-labelledby="fin-section-charts">
          <PageSection
            kicker="4 · Outlook"
            title="Charts & scenarios"
            description="See how revenue compounds over the year and how different income levels affect your take-home."
            id="fin-section-charts"
          />
          <div className="card p-5">
            <ProjectionChart
              monthlyRevenue={monthlyRevenue}
              monthlyTakeHome={monthlyTakeHome}
            />
          </div>
          <Expandable
            icon={BarChart3}
            iconBg="bg-brand-50"
            iconColor="text-brand-600"
            title="Revenue scenarios"
            subtitle="What if you earn more or less than expected?"
            defaultOpen
          >
            <ScenarioComparison
              monthlyRevenue={monthlyRevenue}
              monthlyExpenses={monthlyExpenses}
            />
          </Expandable>
        </section>
      )}

      {/* ── 5. Operations (expenses + break-even) ────────────────────────── */}
      <section className="space-y-3" aria-labelledby="fin-section-ops">
        <PageSection
          kicker="5 · Operations"
          title="Expenses & break-even"
          description="Adjust category amounts to match your reality, then see how close you are to covering costs and taxes."
          id="fin-section-ops"
        />
        {monthlyRevenue > 0 && (
          <BreakEvenCard
            monthlyRevenue={monthlyRevenue}
            monthlyExpenses={monthlyExpenses}
          />
        )}
        <Expandable
          icon={PiggyBank}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          title="Expense breakdown"
          subtitle={`${expenseCategories.length} categories — edit any amount`}
          defaultOpen
        >
          <div className="p-5 space-y-5">
            <ExpenseDonut
              categories={expenseCategories}
              total={monthlyExpenses}
            />
            <div className="space-y-2">
              {expenseCategories.map((cat) => (
                <div key={cat.key} className="flex items-center gap-3 py-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{cat.label}</p>
                    <p className="text-[10px] text-slate-400">
                      {cat.description}
                    </p>
                  </div>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={cat.amount || ""}
                      onChange={(e) =>
                        updateExpense(cat.key, Number(e.target.value) || 0)
                      }
                      className="input py-1.5 pl-6 text-xs text-right tabular-nums"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Expandable>
      </section>

      {/* ── 6. Planning (calendar) ───────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="fin-section-planning">
        <PageSection
          kicker="6 · Planning"
          title="Tax calendar"
          description="Key dates for installments and filing — use this as a reminder, not personalized advice."
          id="fin-section-planning"
        />
        <Expandable
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          title="2026 tax calendar"
          subtitle="Installment dates and estimated amounts"
        >
          <TaxCalendar quarterlyInstallment={quarterlyInstallment} />
        </Expandable>
      </section>

      {/* ── 7. Deductions ──────────────────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="fin-section-deductions">
        <PageSection
          kicker="7 · Deductions"
          title="Common write-offs"
          description="Typical deductible costs for your business type — rough savings use a marginal rate estimate."
          id="fin-section-deductions"
        />
        <Expandable
          icon={Receipt}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          title="Deduction tracker"
          subtitle="Pre-loaded for your business type"
        >
          <DeductionTracker clusterId={clusterId} />
        </Expandable>
      </section>

      {/* ── 8. Risks & funding ─────────────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="fin-section-risks">
        <PageSection
          kicker="8 · Next steps"
          title="Watch-outs & funding"
          description="Flags tailored to your numbers, plus how matched funding could extend your runway."
          id="fin-section-risks"
        />
        {flags.length > 0 && (
          <div className="space-y-3">
            {flags.map((flag, i) => {
              const Icon = flag.icon;
              const styles = {
                warning: {
                  card: "border-amber-200 bg-amber-50",
                  icon: "bg-amber-100 text-amber-600",
                  title: "text-amber-900",
                  body: "text-amber-800",
                },
                info: {
                  card: "border-blue-200 bg-blue-50",
                  icon: "bg-blue-100 text-blue-600",
                  title: "text-blue-900",
                  body: "text-blue-800",
                },
                tip: {
                  card: "border-brand-200 bg-brand-50",
                  icon: "bg-brand-100 text-brand-600",
                  title: "text-brand-900",
                  body: "text-brand-800",
                },
              }[flag.type];
              return (
                <div
                  key={i}
                  className={`rounded-xl border ${styles.card} p-4 flex gap-3`}
                >
                  <div
                    className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${styles.icon} shrink-0 mt-0.5`}
                  >
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${styles.title}`}>
                      {flag.title}
                    </p>
                    <p
                      className={`text-sm ${styles.body} mt-0.5 leading-relaxed`}
                    >
                      {flag.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
