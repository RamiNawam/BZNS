"use client";

import { useEffect } from "react";
import { Map, RefreshCw } from "lucide-react";
import { useRoadmapStore } from "@/stores/roadmap-store";
import { useProfileStore } from "@/stores/profile-store";
import RoadmapStep from "./roadmap-step";
import ProgressBar from "@/components/ui/progress-bar";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function StepSkeleton({ order }: { order: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="h-9 w-9 rounded-full skeleton" />
        {order < 3 && (
          <div className="w-0.5 flex-1 min-h-[40px] bg-slate-100 mt-1" />
        )}
      </div>
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
  const { steps, isLoading, loadRoadmap, generateRoadmap } = useRoadmapStore();
  const { profile } = useProfileStore();

  const roadmapIsStale =
    steps.length > 0 &&
    !!profile?.updated_at &&
    new Date(profile.updated_at) > new Date(steps[0].created_at);

  useEffect(() => {
    if (profile?.id) {
      loadRoadmap(profile.id);
    }
  }, [profile?.id, loadRoadmap]);

  const sorted = steps.slice().sort((a, b) => a.step_order - b.step_order);
  const completed = steps.filter((s) => s.status === "completed").length;
  const progress =
    steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3].map((i) => (
          <StepSkeleton key={i} order={i} />
        ))}
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
          <p className="font-heading font-semibold text-slate-900">
            No roadmap yet
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {profile?.id
              ? "Generate your personalised legal checklist."
              : "Complete your business profile first."}
          </p>
        </div>
        {profile?.id && (
          <button
            onClick={() => generateRoadmap(profile.id)}
            className="btn-primary"
          >
            Generate My Roadmap
          </button>
        )}
      </div>
    );
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stale warning */}
      {roadmapIsStale && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-amber-800">
            <RefreshCw size={15} className="shrink-0 text-amber-600" />
            <span>Your settings changed since this roadmap was generated.</span>
          </div>
          <button
            onClick={() => profile?.id && generateRoadmap(profile.id)}
            disabled={isLoading}
            className="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            Update roadmap
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="card p-5">
        <ProgressBar
          value={progress}
          label={`${completed} of ${steps.length} steps completed`}
          showValue
        />
      </div>

      {/* Timeline */}
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
