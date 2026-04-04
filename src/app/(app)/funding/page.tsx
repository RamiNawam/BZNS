'use client';

import { useEffect } from 'react';
import { DollarSign, Loader2, Sparkles } from 'lucide-react';
import { useFundingStore } from '@/stores/funding-store';
import { useProfileStore } from '@/stores/profile-store';
import FundingList from '@/components/funding/funding-list';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function FundingPage() {
  const { matches, immediateTotal, immediateCount, isGenerating, generateMatches, loadMatches } = useFundingStore();
  const { profile, loadProfile } = useProfileStore();
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.id) loadMatches();
  }, [profile?.id, loadMatches]);

  const hasMatches = matches.length > 0;

  // Badge: always show count of fully-eligible programs
  const badgeValue = immediateCount > 0 ? `${immediateCount}` : '';
  const badgeLabel = immediateCount === 1 ? t('funding.programReady') : t('funding.programsReady');

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-brand-50">
              <DollarSign size={18} className="text-brand-600" />
            </div>
            <h1 className="page-title">{t('funding.pageTitle')}</h1>
          </div>
          <p className="page-subtitle">
            {t('funding.pageSubtitle')}
          </p>
        </div>

        {/* Immediately eligible badge */}
        {badgeValue && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-500 mb-0.5">{badgeLabel}</p>
            <p className="font-heading text-2xl font-bold text-emerald-600 tabular-nums">
              {badgeValue}
            </p>
          </div>
        )}
      </div>

      {/* Generate CTA — only when no matches */}
      {!hasMatches && !isGenerating && profile?.id && (
        <div className="card p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-50 mx-auto">
            <Sparkles size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-heading font-semibold text-slate-900">
              {t('funding.findOpportunities')}
            </p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {t('funding.findDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={generateMatches}
            className="btn-primary gap-2 inline-flex"
          >
            <Sparkles size={15} />
            {t('funding.findBtn')}
          </button>
        </div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div className="card p-6 text-center space-y-3">
          <Loader2 size={28} className="animate-spin text-brand-500 mx-auto" />
          <div>
            <p className="font-heading font-semibold text-slate-900">{t('funding.scoring')}</p>
            <p className="text-sm text-slate-500 mt-1">
              {t('funding.scoringDesc')}
            </p>
          </div>
        </div>
      )}

      {/* List + stale banner live inside FundingList (same pattern as RoadmapList) */}
      {!isGenerating && <FundingList />}

    </div>
  );
}
