'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Map,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { useRoadmapStore } from '@/stores/roadmap-store';
import SnapshotCard from '@/components/financial/snapshot-card';

const businessTypeLabels: Record<string, string> = {
  food: 'Food & Bakery',
  freelance: 'Freelance / Consulting',
  daycare: 'Childcare',
  retail: 'Retail',
  personal_care: 'Personal Care',
  tech: 'Tech / Software',
  creative: 'Creative Services',
  other: 'Business',
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
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${iconBg} mb-4`}>
        <Icon size={19} className={iconColor} />
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm text-slate-400 mt-1 flex-1">{sub}</p>
      <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <span>{cta}</span>
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, loadProfile, isLoading: profileLoading } = useProfileStore();
  const { steps, loadRoadmap } = useRoadmapStore();

  useEffect(() => {
    loadProfile();
    loadRoadmap();
  }, [loadProfile, loadRoadmap]);

  const completedSteps = steps.filter((s) => s.status === 'completed').length;

  // ── No profile yet ─────────────────────────────────────────────────────────
  if (!profileLoading && !profile?.intake_completed) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-10 text-center space-y-5">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-50 mx-auto">
            <Sparkles size={24} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">Welcome to BZNS</h2>
            <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
              Answer 8 quick questions about your business idea. We&apos;ll generate
              your personalized Québec roadmap, funding matches, and tax snapshot.
            </p>
          </div>
          <Link href="/intake" className="btn-primary btn-lg gap-2 inline-flex mx-auto">
            <ArrowRight size={16} />
            Start your business profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Has profile ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">
            {profile?.business_name ?? 'Your Business'}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {profile?.business_type && (
              <span className="badge badge-brand">
                {businessTypeLabels[profile.business_type] ?? profile.business_type}
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
        <Link href="/intake" className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
          Edit profile
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          href="/roadmap"
          icon={Map}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          label="Roadmap Progress"
          value={steps.length > 0 ? `${completedSteps}/${steps.length}` : '—'}
          sub={steps.length > 0 ? 'steps completed' : 'Complete intake to generate'}
          cta="View roadmap"
        />
        <StatCard
          href="/funding"
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Funding Available"
          value="$95K+"
          sub="across matched programs"
          cta="View matches"
        />
        <StatCard
          href="/assistant"
          icon={MessageSquare}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          label="AI Assistant"
          value="Ask"
          sub="anything about your business"
          cta="Open chat"
        />
      </div>

      {/* Quick wins */}
      {steps.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-slate-900">Next steps</h3>
            <Link href="/roadmap" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {steps
              .filter((s) => s.status !== 'completed')
              .slice(0, 3)
              .map((step) => (
                <div key={step.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <CheckCircle2 size={16} className="text-slate-300 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{step.title}</p>
                    {step.estimated_cost && step.estimated_cost !== 'Free' && (
                      <p className="text-xs text-slate-400 mt-0.5">{step.estimated_cost}</p>
                    )}
                  </div>
                  <TrendingUp size={13} className="text-brand-400 shrink-0 mt-0.5 ml-auto" />
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
