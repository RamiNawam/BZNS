'use client';

import { useEffect } from 'react';
import { Sparkles, Loader2, Map } from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { useRoadmapStore } from '@/stores/roadmap-store';
import RoadmapList from '@/components/roadmap/roadmap-list';

export default function RoadmapPage() {
  const { profile, loadProfile } = useProfileStore();
  const { steps, isLoading, isGenerating, generateRoadmap } = useRoadmapStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const hasRoadmap = steps.length > 0;
  const showLoading = isLoading || isGenerating;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Legal Roadmap</h1>
          <p className="page-subtitle">
            Personalized, dependency-ordered steps to launch your business in Québec legally.
          </p>
        </div>

        {/* Generate button — only show when no roadmap exists and not generating */}
        {!hasRoadmap && !showLoading && profile?.id && (
          <button
            type="button"
            onClick={() => generateRoadmap(profile.id)}
            className="btn-primary gap-2 shrink-0"
          >
            <Sparkles size={15} />
            Generate my roadmap
          </button>
        )}

        {showLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
            <Loader2 size={15} className="animate-spin text-brand-500" />
            Generating…
          </div>
        )}
      </div>

      {/* No profile yet */}
      {!profile?.intake_completed && !showLoading && (
        <div className="card p-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 mx-auto">
            <Map size={24} className="text-slate-400" />
          </div>
          <div>
            <p className="font-heading font-semibold text-slate-900">Complete your business profile first</p>
            <p className="text-sm text-slate-500 mt-1">We need to know about your business before we can generate your roadmap.</p>
          </div>
        </div>
      )}

      {/* Roadmap */}
      {(hasRoadmap || showLoading) && <RoadmapList />}

    </div>
  );
}
