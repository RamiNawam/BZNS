"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import type {
  RoadmapStep as RoadmapStepType,
  StepStatus,
  StepConfidence,
  GapFlag,
} from "@/types/roadmap";
import { useRoadmapStore } from "@/stores/roadmap-store";
import { useProfileStore } from "@/stores/profile-store";
import StepDetail from "./step-detail";

interface RoadmapStepProps {
  step: RoadmapStepType;
  allSteps: RoadmapStepType[];
  isLast: boolean;
  displayOrder: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLocked(step: RoadmapStepType, allSteps: RoadmapStepType[]): boolean {
  return (step.depends_on ?? []).some((dep) => {
    const prereq = allSteps.find((s) => s.step_key === dep);
    return prereq?.status !== "completed";
  });
}

function nextStatus(current: StepStatus): StepStatus {
  if (current === "pending") return "in_progress";
  if (current === "in_progress") return "completed";
  return "pending";
}

const STATUS_BADGE: Record<StepStatus, string> = {
  pending: "badge bg-slate-100 text-slate-600",
  in_progress: "badge bg-blue-100 text-blue-700",
  completed: "badge bg-emerald-100 text-emerald-700",
  skipped: "badge bg-slate-100 text-slate-400",
};

const STATUS_LABEL: Record<StepStatus, string> = {
  pending: "To do",
  in_progress: "In progress",
  completed: "Done",
  skipped: "Skipped",
};

// ── Confidence styling ───────────────────────────────────────────────────────

const CONFIDENCE_BORDER: Record<StepConfidence, string> = {
  verified: "border-l-emerald-400",
  inferred: "border-l-teal-400",
  flagged: "border-l-amber-400",
};

const CONFIDENCE_BADGE: Record<
  StepConfidence,
  { class: string; label: string; icon: typeof ShieldCheck }
> = {
  verified: {
    class: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Verified",
    icon: ShieldCheck,
  },
  inferred: {
    class: "bg-teal-50 text-teal-700 border-teal-200",
    label: "Recommended",
    icon: Sparkles,
  },
  flagged: {
    class: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Needs Attention",
    icon: Search,
  },
};

const SEVERITY_STYLE: Record<string, string> = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  low: "bg-slate-50 border-slate-200 text-slate-700",
};

// ── Flag card ────────────────────────────────────────────────────────────────

function FlagCard({ flag }: { flag: GapFlag }) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${SEVERITY_STYLE[flag.severity]}`}
    >
      <div className="flex items-start gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs uppercase tracking-wide">
              {flag.severity} — {flag.type.replace(/_/g, " ")}
            </span>
          </div>
          <p className="leading-relaxed">{flag.issue}</p>
          <p className="font-medium">{flag.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

// ── Timeline node ─────────────────────────────────────────────────────────────

function StepNode({
  step,
  locked,
  displayOrder,
}: {
  step: RoadmapStepType;
  locked: boolean;
  displayOrder: number;
}) {
  const confidence = step.confidence ?? "verified";

  if (locked) {
    return (
      <div className="h-9 w-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-300 tabular-nums">
          {displayOrder}
        </span>
      </div>
    );
  }

  if (step.status === "completed") {
    return (
      <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center shadow-brand-sm">
        <Check size={15} strokeWidth={3} className="text-white" />
      </div>
    );
  }

  if (step.status === "in_progress") {
    return (
      <div className="h-9 w-9 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
      </div>
    );
  }

  // Pending — color the node ring by confidence
  if (confidence === "flagged") {
    return (
      <div className="h-9 w-9 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center">
        <Search size={13} className="text-amber-500" />
      </div>
    );
  }
  if (confidence === "inferred") {
    return (
      <div className="h-9 w-9 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center">
        <Sparkles size={13} className="text-amber-500" />
      </div>
    );
  }

  return (
    <div className="h-9 w-9 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center">
      <span className="text-xs font-bold text-slate-400 tabular-nums">
        {displayOrder}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RoadmapStep({
  step,
  allSteps,
  isLast,
  displayOrder,
}: RoadmapStepProps) {
  const [expanded, setExpanded] = useState(false);
  const { updateStepStatus } = useRoadmapStore();
  const { profile } = useProfileStore();

  const locked = isLocked(step, allSteps);
  const isCompleted = step.status === "completed";
  const confidence = step.confidence ?? "verified";
  const confidenceInfo = CONFIDENCE_BADGE[confidence];
  const ConfidenceIcon = confidenceInfo.icon;
  const stepFlags = step.flags ?? [];

  const blockingTitles = (step.depends_on ?? [])
    .map((dep) => allSteps.find((s) => s.step_key === dep))
    .filter((s) => s && s.status !== "completed")
    .map((s) => s!.title)
    .slice(0, 1);

  function handleCheck(e: React.MouseEvent) {
    e.stopPropagation();
    if (locked || !profile?.id) return;
    updateStepStatus(step.id, profile.id, nextStatus(step.status));
  }

  return (
    <div className="flex gap-4">
      {/* Left rail */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <StepNode step={step} locked={locked} displayOrder={displayOrder} />
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[32px] mt-1 ${
              isCompleted
                ? "bg-brand-200"
                : confidence === "flagged"
                  ? "bg-amber-200"
                  : confidence === "inferred"
                    ? "bg-teal-200"
                    : "bg-slate-200"
            }`}
          />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 pb-5 ${isLast ? "pb-0" : ""}`}>
        <div
          className={`card transition-all overflow-hidden border-l-4 ${
            CONFIDENCE_BORDER[confidence]
          } ${
            locked
              ? "cursor-default"
              : isCompleted
                ? "border-l-emerald-400 bg-emerald-50/30"
                : confidence === "flagged"
                  ? "hover:shadow-card-hover cursor-pointer"
                  : "hover:shadow-card-hover hover:border-slate-300 cursor-pointer"
          }`}
        >
          {/* Header */}
          <button
            type="button"
            onClick={locked ? undefined : () => setExpanded((e) => !e)}
            disabled={locked}
            className="w-full text-left p-5"
          >
            <div className="flex items-start gap-3">
              {/* Checkbox — hidden for locked steps */}
              {!locked && (
                <div
                  onClick={handleCheck}
                  className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${
                    isCompleted
                      ? "border-brand-600 bg-brand-600"
                      : "border-slate-300 hover:border-brand-400"
                  }`}
                >
                  {isCompleted && <Check size={11} className="text-white" />}
                  {step.status === "in_progress" && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-heading font-semibold text-sm ${
                      locked
                        ? "text-slate-400"
                        : isCompleted
                          ? "line-through text-slate-400"
                          : "text-slate-900"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className={STATUS_BADGE[step.status]}>
                    {STATUS_LABEL[step.status]}
                  </span>

                  {/* Confidence badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${confidenceInfo.class}`}
                  >
                    <ConfidenceIcon size={10} />
                    {confidenceInfo.label}
                  </span>
                </div>

                {locked && blockingTitles.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Complete &quot;{blockingTitles[0]}&quot; first
                  </p>
                )}

                {!locked && step.description && (
                  <p
                    className={`text-sm text-slate-500 mt-1 ${expanded ? "" : "line-clamp-2"}`}
                  >
                    {step.description}
                  </p>
                )}

                {!locked &&
                  (step.estimated_timeline || step.estimated_cost) && (
                    <div className="flex gap-3 mt-2 text-xs text-slate-400">
                      {step.estimated_timeline && (
                        <span className="flex items-center gap-1">
                          <span>&#9201;</span> {step.estimated_timeline}
                        </span>
                      )}
                      {step.estimated_cost && (
                        <span className="flex items-center gap-1">
                          <span>&#128176;</span> {step.estimated_cost}
                        </span>
                      )}
                    </div>
                  )}

                {/* Inline flag summary when collapsed */}
                {!expanded && stepFlags.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <Search size={12} className="text-amber-500" />
                    <span className="text-amber-600 font-medium">
                      {stepFlags.length} item{stepFlags.length > 1 ? "s" : ""}{" "}
                      to review
                    </span>
                  </div>
                )}
              </div>

              {/* Chevron */}
              {!locked && (
                <div className="text-slate-400">
                  {expanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Expanded: flags + step detail */}
          {expanded && !locked && (
            <div className="border-t border-slate-100">
              {/* Flags section */}
              {stepFlags.length > 0 && (
                <div className="px-5 pt-4 space-y-2">
                  {stepFlags.map((flag, i) => (
                    <FlagCard key={`${flag.type}-${i}`} flag={flag} />
                  ))}
                </div>
              )}
              <StepDetail step={step} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
