'use client';

import { useEffect, useState } from 'react';
import { DollarSign, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useFundingStore } from '@/stores/funding-store';
import { useProfileStore } from '@/stores/profile-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
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

const FILTER_KEYS: FilterKey[] = [
  'all', 'grant', 'loan', 'tax_credit', 'mentorship', 'bookmarked',
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
  const { matches, isLoading, isGenerating, isStale, loadMatches, generateMatches } = useFundingStore();
  const profile = useProfileStore((s) => s.profile);
  const [filter, setFilter] = useState<FilterKey>('all');
  const { t } = useTranslation();

  const FILTER_LABELS: Record<FilterKey, string> = {
    all: t('funding.filters.all'),
    grant: t('funding.filters.grant'),
    loan: t('funding.filters.loan'),
    tax_credit: t('funding.filters.taxCredit'),
    mentorship: t('funding.filters.mentorship'),
    bookmarked: t('funding.filters.bookmarked'),
  };

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

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
          <p className="font-heading font-semibold text-slate-900">{t('funding.noMatches')}</p>
          <p className="text-sm text-slate-500 mt-1">
            {t('funding.noMatchesDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stale warning — same pattern as RoadmapList */}
      {isStale && !isGenerating && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-amber-800">
            <RefreshCw size={15} className="shrink-0 text-amber-600" />
            <span>{t('funding.staleWarning')}</span>
          </div>
          <button
            onClick={generateMatches}
            disabled={isGenerating}
            className="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {t('funding.refreshBtn')}
          </button>
        </div>
      )}

      {/* Visible count */}
      <p className="text-sm text-slate-500">
        {visible.length} {visible.length !== 1 ? t('funding.programsFound') : t('funding.programFound')}
      </p>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_KEYS.map((key) => {
          const label = FILTER_LABELS[key];
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
            title={t('funding.readyNow')}
            subtitle={t('funding.readyNowDesc')}
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
            title={t('funding.unlockMore')}
            subtitle={t('funding.unlockMoreDesc')}
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
          <p className="text-sm text-slate-500">{t('funding.noFilter')}</p>
        </div>
      )}
    </div>
  );
}
