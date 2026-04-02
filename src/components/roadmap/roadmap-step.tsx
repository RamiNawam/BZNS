'use client';

import { useState } from 'react';
import {
  Check,
  Lock,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { RoadmapStep as RoadmapStepType, StepStatus } from '@/types/roadmap';
import { useRoadmapStore } from '@/stores/roadmap-store';
import StepDetail from './step-detail';

interface RoadmapStepProps {
  step: RoadmapStepType;
  allSteps: RoadmapStepType[];
  isLast: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLocked(step: RoadmapStepType, allSteps: RoadmapStepType[]): boolean {
  return (step.depends_on ?? []).some((dep) => {
    const prereq = allSteps.find((s) => s.step_key === dep);
    return prereq?.status !== 'completed';
  });
}

function nextStatus(current: StepStatus): StepStatus {
  if (current === 'pending') return 'in_progress';
  if (current === 'in_progress') return 'completed';
  return 'pending';
}

const STATUS_BADGE: Record<StepStatus, string> = {
  pending:     'badge bg-slate-100 text-slate-600',
  in_progress: 'badge bg-blue-100 text-blue-700',
  completed:   'badge bg-emerald-100 text-emerald-700',
  skipped:     'badge bg-slate-100 text-slate-400',
};

const STATUS_LABEL: Record<StepStatus, string> = {
  pending:     'To do',
  in_progress: 'In progress',
  completed:   'Done',
  skipped:     'Skipped',
};

// ── Timeline node ─────────────────────────────────────────────────────────────

function StepNode({
  step,
  locked,
}: {
  step: RoadmapStepType;
  locked: boolean;
}) {
  if (locked) {
    return (
      <div className="h-9 w-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
        <Lock size={13} className="text-slate-400" />
      </div>
    );
  }
  if (step.status === 'completed') {
    return (
      <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center shadow-brand-sm">
        <Check size={15} strokeWidth={3} className="text-white" />
      </div>
    );
  }
  if (step.status === 'in_progress') {
    return (
      <div className="h-9 w-9 rounded-full border-2 border-brand-500 bg-white flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse" />
      </div>
    );
  }
  // pending
  return (
    <div className="h-9 w-9 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center">
      <span className="text-xs font-bold text-slate-400 tabular-nums">{step.step_order}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RoadmapStep({ step, allSteps, isLast }: RoadmapStepProps) {
  const [expanded, setExpanded] = useState(false);
  const { updateStepStatus } = useRoadmapStore();
  const locked = isLocked(step, allSteps);
  const isCompleted = step.status === 'completed';

  // Find blocking prereq titles for the lock message
  const blockingTitles = (step.depends_on ?? [])
    .map((dep) => allSteps.find((s) => s.step_key === dep))
    .filter((s) => s && s.status !== 'completed')
    .map((s) => s!.title)
    .slice(0, 1); // show at most one

  function handleCheck(e: React.MouseEvent) {
    e.stopPropagation();
    if (locked) return;
    updateStepStatus(step.id, nextStatus(step.status));
  }

  return (
    <div className="flex gap-4">

      {/* Left rail: node + connector line */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <StepNode step={step} locked={locked} />
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[32px] mt-1 transition-colors duration-300 ${
            isCompleted ? 'bg-brand-200' : 'bg-slate-200'
          }`} />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
        <div
          className={`card transition-all duration-200 overflow-hidden ${
            locked
              ? 'opacity-50 cursor-not-allowed'
              : isCompleted
              ? 'border-emerald-200 bg-emerald-50/30'
              : 'hover:shadow-card-hover hover:border-slate-300 cursor-pointer'
          }`}
        >
          {/* Header row */}
          <button
            type="button"
            onClick={locked ? undefined : () => setExpanded((e) => !e)}
            disabled={locked}
            aria-expanded={expanded}
            className="w-full text-left p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset rounded-2xl"
          >
            <div className="flex items-start gap-3">

              {/* Checkbox area */}
              <div
                role="checkbox"
                aria-checked={isCompleted}
                aria-label={locked ? 'Step locked' : `Mark step ${isCompleted ? 'incomplete' : 'in progress'}`}
                onClick={handleCheck}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleCheck(e as unknown as React.MouseEvent); }}
                tabIndex={locked ? -1 : 0}
                className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  locked
                    ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                    : isCompleted
                    ? 'border-brand-600 bg-brand-600 cursor-pointer'
                    : step.status === 'in_progress'
                    ? 'border-blue-400 bg-blue-50 cursor-pointer'
                    : 'border-slate-300 hover:border-brand-400 cursor-pointer'
                }`}
              >
                {isCompleted && <Check size={11} strokeWidth={3} className="text-white" />}
                {step.status === 'in_progress' && <div className="h-2 w-2 rounded-full bg-blue-500" />}
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-heading font-semibold text-sm leading-snug ${
                    isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}>
                    {step.title}
                  </span>
                  <span className={STATUS_BADGE[step.status]}>
                    {STATUS_LABEL[step.status]}
                  </span>
                </div>

                {/* Lock message */}
                {locked && blockingTitles.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Lock size={11} className="text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-400">
                      Complete &ldquo;{blockingTitles[0]}&rdquo; first
                    </span>
                  </div>
                )}

                {/* Description */}
                {!locked && step.description && (
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {step.description}
                  </p>
                )}

                {/* Meta chips */}
                {!locked && (step.estimated_timeline || step.estimated_cost) && (
                  <div className="flex items-center gap-3 mt-2">
                    {step.estimated_timeline && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} />
                        {step.estimated_timeline}
                      </span>
                    )}
                    {step.estimated_cost && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <DollarSign size={11} />
                        {step.estimated_cost}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Expand chevron */}
              {!locked && (
                <div className="shrink-0 text-slate-400 mt-0.5">
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              )}
            </div>
          </button>

          {/* Expanded detail */}
          {expanded && !locked && (
            <div className="border-t border-slate-100">
              <StepDetail step={step} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
