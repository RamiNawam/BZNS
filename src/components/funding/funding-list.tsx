'use client';

import { useEffect, useState } from 'react';
import { DollarSign, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useFundingStore } from '@/stores/funding-store';
import { useProfileStore } from '@/stores/profile-store';
import FundingCard from './funding-card';
import { isFullyMatched, isAchievable } from '@/lib/funding/classify';
import type { FundingMatch, ProgramType } from '@/types/funding';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FundingCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="skeleton h-[52px] w-[52px] rounded-full shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex gap-2">
            <div className="skeleton h-4 w-1/2 rounded-lg" />
            <div className="skeleton h-4 w-16 rounded-full" />
          </div>
          <div className="skeleton h-3.5 w-1/4 rounded-lg" />
          <div className="skeleton h-3 w-full rounded-lg" />
          <div className="skeleton h-3 w-3/4 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
type FilterKey = 'all' | ProgramType | 'bookmarked';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'grant',      label: 'Grants' },
  { key: 'loan',       label: 'Loans' },
  { key: 'tax_credit', label: 'Tax Credits' },
  { key: 'mentorship', label: 'Mentorship' },
  { key: 'bookmarked', label: 'Bookmarked' },
];

// ── Visibility filter ─────────────────────────────────────────────────────────

const ALWAYS_IMMUTABLE_KEYS = [
  'age_eligible',
  'location_eligible',
  'immigration_status_eligible',
  'business_type_eligible',
] as const;

function makeIsVisible(inferredStage: string) {
  return function isVisible(match: FundingMatch): boolean {
    const details = match.eligibility_details ?? {};
    for (const key of ALWAYS_IMMUTABLE_KEYS) {
      if (key in details && details[key] === false) return false;
    }
    if ('business_stage_eligible' in details && details.business_stage_eligible === false) {
      if (inferredStage !== 'pre_launch') return false;
    }
    return true;
  };
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  count,
}: {
  icon: typeof CheckCircle2;
  iconClass: string;
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${iconClass}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-sm text-slate-900">{title}</span>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FundingList() {
  const { matches, isLoading, isGenerating, loadMatches, generateMatches } = useFundingStore();
  const profile = useProfileStore((s) => s.profile);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Same pattern as RoadmapList: profile.updated_at > matches[0].created_at.
  // This now works correctly because generateMatches (force_refresh) deletes all
  // existing matches before inserting fresh ones — giving a guaranteed fresh created_at.
  const fundingIsStale =
    matches.length > 0 &&
    !!profile?.updated_at &&
    new Date(profile.updated_at) > new Date(matches[0].created_at);

  const inferredStage = !profile?.has_neq
    ? 'pre_launch'
    : (profile?.expected_monthly_revenue ?? 0) < 5000
    ? 'launching'
    : 'operating';

  const isVisible = makeIsVisible(inferredStage);

  const visible = matches.filter((m) => !m.is_dismissed && isVisible(m));

  const applyTypeFilter = (list: FundingMatch[]) =>
    list
      .filter((m) =>
        filter === 'all'
          ? true
          : filter === 'bookmarked'
          ? m.is_bookmarked
          : m.program_type === filter
      )
      .sort((a, b) => b.match_score - a.match_score);

  const readyNow   = applyTypeFilter(visible.filter(isFullyMatched));
  const achievable = applyTypeFilter(visible.filter(isAchievable));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <FundingCardSkeleton />
        <FundingCardSkeleton />
        <FundingCardSkeleton />
      </div>
    );
  }

  if (matches.length === 0 || visible.length === 0) {
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 mx-auto">
          <DollarSign size={24} className="text-slate-400" />
        </div>
        <div>
          <p className="font-heading font-semibold text-slate-900">No funding matches yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Click &ldquo;Find my funding&rdquo; above to score programs against your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stale warning — same pattern as RoadmapList */}
      {fundingIsStale && !isGenerating && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-amber-800">
            <RefreshCw size={15} className="shrink-0 text-amber-600" />
            <span>Your settings changed since your funding was last scored.</span>
          </div>
          <button
            onClick={generateMatches}
            disabled={isGenerating}
            className="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            Refresh matches
          </button>
        </div>
      )}

      {/* Visible count */}
      <p className="text-sm text-slate-500">
        {visible.length} program{visible.length !== 1 ? 's' : ''} found
      </p>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label }) => {
          const count = key === 'all'
            ? visible.length
            : key === 'bookmarked'
            ? visible.filter((m) => m.is_bookmarked).length
            : visible.filter((m) => m.program_type === key).length;
          if (key !== 'all' && key !== 'bookmarked' && count === 0) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1.5 ${filter === key ? 'text-teal-200' : 'text-slate-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section 1: Ready to apply now */}
      {readyNow.length > 0 && (
        <div>
          <SectionHeader
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
            title="Ready to apply now"
            subtitle="You meet all current eligibility requirements for these programs."
            count={readyNow.length}
          />
          <div className="space-y-3">
            {readyNow.map((match) => (
              <FundingCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Achievable with extra steps */}
      {achievable.length > 0 && (
        <div>
          <SectionHeader
            icon={Clock}
            iconClass="bg-amber-50 text-amber-600"
            title="Unlock with a few more steps"
            subtitle="You meet the core requirements. Complete the flagged steps in your Roadmap to qualify."
            count={achievable.length}
          />
          <div className="space-y-3">
            {achievable.map((match) => (
              <FundingCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for active filter */}
      {readyNow.length === 0 && achievable.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">No programs match this filter.</p>
        </div>
      )}
    </div>
  );
}
