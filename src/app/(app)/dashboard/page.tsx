"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Map,
  DollarSign,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  MapPin,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { useRoadmapStore } from "@/stores/roadmap-store";
import { useFundingStore } from "@/stores/funding-store";
import SnapshotCard from "@/components/financial/snapshot-card";
import { calculateTakeHome } from "@/lib/financial/tax-calculator";
import { getExpenseDefaults } from "@/lib/financial/expense-defaults";
import type { ClusterComplexity } from "@/types/profile";
import type { ClusterID } from "@/lib/clusters";

const CLUSTER_COLORS: Record<ClusterComplexity, string> = {
  low: "bg-green-50 text-green-800 border-green-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-red-50 text-red-800 border-red-200",
};

const businessTypeLabels: Record<string, string> = {
  food: "Food & Bakery",
  freelance: "Freelance / Consulting",
  daycare: "Childcare",
  retail: "Retail",
  personal_care: "Personal Care",
  tech: "Tech / Software",
  creative: "Creative Services",
  other: "Business",
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  href,
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  cta,
}: {
  href: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="card p-6 hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 group flex flex-col"
    >
      <div
        className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${iconBg} mb-4`}
      >
        <Icon size={19} className={iconColor} />
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="text-sm text-slate-400 mt-1 flex-1">{sub}</p>
      <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <span>{cta}</span>
        <ArrowRight
          size={12}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, loadProfile, isLoading: profileLoading } = useProfileStore();
  const {
    steps,
    isLoading: roadmapLoading,
    isStale: roadmapIsStale,
    error: roadmapError,
    loadRoadmap,
    generateRoadmap,
  } = useRoadmapStore();
  const { immediateCount, loadMatches } = useFundingStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.id) {
      loadRoadmap(profile.id);
      loadMatches();
    }
  }, [profile?.id, loadRoadmap, loadMatches]);

  const completedSteps = steps.filter((s) => s.status === "completed").length;

  const monthlyRevenue = profile?.expected_monthly_revenue ?? 0;
  const clusterId = (profile?.cluster_id ?? 'C2') as ClusterID;
  const monthlyExpenses = profile?.monthly_expenses ?? getExpenseDefaults(clusterId).total;
  const businessStructure = profile?.business_structure ?? 'sole_proprietorship';

  const monthlyTakeHome = useMemo(() => {
    if (!monthlyRevenue) return 0;
    const taxes = calculateTakeHome(monthlyRevenue * 12, monthlyExpenses * 12, businessStructure);
    return Math.max(0, taxes.estimatedTakeHome);
  }, [monthlyRevenue, monthlyExpenses, businessStructure]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

  // ── No profile yet ─────────────────────────────────────────────────────────
  if (!profileLoading && !profile?.intake_completed) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-10 text-center space-y-5">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-50 mx-auto">
            <Sparkles size={24} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">
              Welcome to BZNS
            </h2>
            <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
              Answer 8 quick questions about your business idea. We&apos;ll
              generate your personalized Québec roadmap, funding matches, and
              tax snapshot.
            </p>
          </div>
          <Link
            href="/intake"
            className="btn-primary btn-lg gap-2 inline-flex mx-auto"
          >
            <ArrowRight size={16} />
            Start your business profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Has profile ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            {profile?.business_name || "Your Business"}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {profile?.cluster_label && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  CLUSTER_COLORS[profile.cluster_complexity ?? "medium"]
                }`}
              >
                {profile.cluster_label}
              </span>
            )}
            {profile?.municipality && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={11} />
                {profile.municipality}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          href="/roadmap"
          icon={Map}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          label="Roadmap Progress"
          value={steps.length > 0 ? `${completedSteps}/${steps.length}` : "—"}
          sub={
            steps.length > 0 ? "steps completed" : "Complete intake to generate"
          }
          cta="View roadmap"
        />
        <StatCard
          href="/funding"
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Funding Available"
          value={immediateCount > 0 ? `${immediateCount}` : "—"}
          sub={
            immediateCount > 0
              ? `program${immediateCount !== 1 ? "s" : ""} ready to apply`
              : "Complete intake to find matches"
          }
          cta="View matches"
        />
        <StatCard
          href="/financial"
          icon={BarChart3}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          label="Monthly Take-Home"
          value={monthlyRevenue > 0 ? fmt(monthlyTakeHome) : "—"}
          sub={monthlyRevenue > 0 ? "after taxes & expenses" : "Set revenue to calculate"}
          cta="View finances"
        />
      </div>

      {/* Stale roadmap warning */}
      {roadmapIsStale && !roadmapLoading && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-amber-800">
            <RefreshCw size={15} className="shrink-0 text-amber-600" />
            <span>
              Your settings changed since your roadmap was generated. Regenerate
              to get updated steps.
            </span>
          </div>
          <button
            onClick={() => profile?.id && generateRoadmap(profile.id)}
            disabled={roadmapLoading}
            className="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            Update roadmap
          </button>
        </div>
      )}

      {/* Roadmap error */}
      {roadmapError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Roadmap error:</span> {roadmapError}
        </div>
      )}

      {/* Generate roadmap CTA — shown when profile is complete but no roadmap yet */}
      {!roadmapLoading && profile?.intake_completed && steps.length === 0 && (
        <div className="card p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-semibold text-slate-900">
              Ready to build your roadmap?
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Generate a personalized legal checklist for your business.
            </p>
          </div>
          <button
            onClick={() => profile.id && generateRoadmap(profile.id)}
            disabled={roadmapLoading}
            className="btn-primary whitespace-nowrap disabled:opacity-50"
          >
            {roadmapLoading ? "Generating…" : "Generate My Roadmap"}
          </button>
        </div>
      )}

      {/* Quick wins */}
      {steps.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-slate-900">
              Next steps
            </h3>
            <Link
              href="/roadmap"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {steps
              .filter((s) => s.status !== "completed")
              .slice(0, 3)
              .map((step) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2
                    size={16}
                    className="text-slate-300 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {step.title}
                    </p>
                    {step.estimated_cost && step.estimated_cost !== "Free" && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {step.estimated_cost}
                      </p>
                    )}
                  </div>
                  <TrendingUp
                    size={13}
                    className="text-brand-400 shrink-0 mt-0.5 ml-auto"
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Financial Snapshot */}
      <SnapshotCard />
    </div>
  );
}
