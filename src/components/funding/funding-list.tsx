'use client';

import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { useFundingStore } from '@/stores/funding-store';
import { useProfileStore } from '@/stores/profile-store';
import FundingCard from './funding-card';
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
    // Business stage: hide only when user can't advance (not pre-launch)
    if ('business_stage_eligible' in details && details.business_stage_eligible === false) {
      if (inferredStage !== 'pre_launch') return false;
    }
    return true;
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FundingList() {
  const { matches, isLoading, loadMatches } = useFundingStore();
  const profile = useProfileStore((s) => s.profile);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const inferredStage = !profile?.has_neq
    ? 'pre_launch'
    : (profile?.expected_monthly_revenue ?? 0) < 5000
    ? 'launching'
    : 'operating';

  const isVisible = makeIsVisible(inferredStage);

  // visible = not dismissed + passes immutability filter
  const visible = matches.filter((m) => !m.is_dismissed && isVisible(m));

  const filtered = visible
    .filter((m) =>
      filter === 'all'
        ? true
        : filter === 'bookmarked'
        ? m.is_bookmarked
        : m.program_type === filter
    )
    .sort((a, b) => b.match_score - a.match_score);

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
    <div className="space-y-4">
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

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">No programs match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => (
            <FundingCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
