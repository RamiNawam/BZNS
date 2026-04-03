'use client';

import { useEffect } from 'react';
import { DollarSign, Loader2, Sparkles } from 'lucide-react';
import { useFundingStore } from '@/stores/funding-store';
import { useProfileStore } from '@/stores/profile-store';
import FundingList from '@/components/funding/funding-list';

export default function FundingPage() {
  const { matches, totalPotential, isGenerating, generateMatches, loadMatches } = useFundingStore();
  const { profile, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.id) loadMatches();
  }, [profile?.id, loadMatches]);

  const hasMatches = matches.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-brand-50">
              <DollarSign size={18} className="text-brand-600" />
            </div>
            <h1 className="page-title">Funding Matcher</h1>
          </div>
          <p className="page-subtitle">
            Grants, loans, and programs matched to your business profile.
          </p>
        </div>

        {/* Total potential badge */}
        {totalPotential && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-500 mb-0.5">Available for you</p>
            <p className="font-heading text-2xl font-bold text-emerald-600 tabular-nums">
              {totalPotential}
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
              Find your funding opportunities
            </p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We&apos;ll score every Quebec and federal program against your profile and show you
              exactly how much you could access.
            </p>
          </div>
          <button
            type="button"
            onClick={generateMatches}
            className="btn-primary gap-2 inline-flex"
          >
            <Sparkles size={15} />
            Find my funding
          </button>
        </div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div className="card p-6 text-center space-y-3">
          <Loader2 size={28} className="animate-spin text-brand-500 mx-auto" />
          <div>
            <p className="font-heading font-semibold text-slate-900">Scoring programs…</p>
            <p className="text-sm text-slate-500 mt-1">
              Matching your profile against all available programs.
            </p>
          </div>
        </div>
      )}

      {/* Regenerate button — when matches exist */}
      {hasMatches && !isGenerating && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {matches.filter((m) => !m.is_dismissed).length} programs found
          </p>
          <button
            type="button"
            onClick={generateMatches}
            className="btn-secondary btn-sm gap-1.5 inline-flex"
          >
            <Sparkles size={12} />
            Refresh matches
          </button>
        </div>
      )}

      {/* List */}
      {!isGenerating && <FundingList />}

    </div>
  );
}
