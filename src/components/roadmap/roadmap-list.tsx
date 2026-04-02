'use client';

import { useEffect } from 'react';
import { Map } from 'lucide-react';
import { useRoadmapStore } from '@/stores/roadmap-store';
import RoadmapStep from './roadmap-step';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function StepSkeleton({ order }: { order: number }) {
  return (
    <div className="flex gap-4">
      {/* Node */}
      <div className="flex flex-col items-center shrink-0">
        <div className="h-9 w-9 rounded-full skeleton" />
        {order < 3 && <div className="w-0.5 flex-1 min-h-[40px] bg-slate-100 mt-1" />}
      </div>
      {/* Card */}
      <div className="flex-1 pb-6">
        <div className="card p-5 space-y-2.5">
          <div className="skeleton h-4 w-2/3 rounded-lg" />
          <div className="skeleton h-3 w-full rounded-lg" />
          <div className="skeleton h-3 w-1/2 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RoadmapList() {
  const { steps, isLoading, loadRoadmap } = useRoadmapStore();

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const sorted = steps.slice().sort((a, b) => a.step_order - b.step_order);
  const completed = steps.filter((s) => s.status === 'completed').length;
  const progress = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3].map((i) => <StepSkeleton key={i} order={i} />)}
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (steps.length === 0) {
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 mx-auto">
          <Map size={24} className="text-slate-400" />
        </div>
        <div>
          <p className="font-heading font-semibold text-slate-900">No roadmap yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Complete your business profile and click &ldquo;Generate my roadmap&rdquo; to get started.
          </p>
        </div>
      </div>
    );
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Progress header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-slate-900 text-sm">
              {completed} of {steps.length} steps completed
            </span>
            <span className="badge badge-brand">{progress}%</span>
          </div>
          {completed === steps.length && steps.length > 0 && (
            <span className="badge bg-emerald-100 text-emerald-800">
              All done
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% of roadmap completed`}
          />
        </div>
      </div>

      {/* Vertical timeline */}
      <div>
        {sorted.map((step, index) => (
          <RoadmapStep
            key={step.id}
            step={step}
            allSteps={steps}
            isLast={index === sorted.length - 1}
          />
        ))}
      </div>

    </div>
  );
}
