"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Map,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRoadmapStore } from "@/stores/roadmap-store";
import { useProfileStore } from "@/stores/profile-store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import RoadmapStep from "./roadmap-step";
import ProgressBar from "@/components/ui/progress-bar";
import type { RoadmapStep as RoadmapStepType } from "@/types/roadmap";

// ── Phase definitions ────────────────────────────────────────────────────────

interface PhaseDefinition {
  id: number;
  name: string;
  slug: string;
}

const PHASES: PhaseDefinition[] = [
  { id: 1, name: "Get Legal", slug: "registration" },
  { id: 2, name: "Get Permitted", slug: "permits" },
  { id: 3, name: "Get Tax-Ready", slug: "tax" },
  { id: 4, name: "Stay Compliant", slug: "compliance" },
];

const PHASE_1_KEYS = new Set(["req_registration", "revenu_quebec", "cra_registration"]);
const PHASE_1_SOURCES = new Set(["req", "revenu_quebec", "cra"]);
const PHASE_2_SOURCES = new Set(["mapaq", "municipal_montreal", "racj", "famille", "professional_orders"]);
const PHASE_3_SOURCES = new Set(["gst_qst", "qpp", "installments", "deductions"]);
const PHASE_4_SOURCES = new Set(["bill96", "signage"]);

function getPhaseId(step: RoadmapStepType, _allSteps: RoadmapStepType[], phaseMap: globalThis.Map<string, number>): number {
  // Inferred steps follow their dependency
  if (step.confidence === "inferred" && step.depends_on?.length) {
    for (const dep of step.depends_on) {
      const depPhase = phaseMap.get(dep);
      if (depPhase) return depPhase;
    }
  }

  const key = step.step_key;
  const source = step.source ?? "";

  if (PHASE_1_KEYS.has(key) || PHASE_1_SOURCES.has(source)) return 1;
  if (PHASE_2_SOURCES.has(source)) return 2;
  if (PHASE_3_SOURCES.has(source)) return 3;
  if (PHASE_4_SOURCES.has(source) || key.includes("renewal")) return 4;

  // Fallback: keyword matching on title
  const titleLower = step.title.toLowerCase();
  if (/registr|incorporat|neq|business number|legal\s*name/.test(titleLower)) return 1;
  if (/permit|licen[cs]e|inspection|zoning|certific/.test(titleLower)) return 2;
  if (/tax|gst|qst|hst|qpp|cpp|deduct|instal|remit/.test(titleLower)) return 3;
  if (/renew|complian|annual|bill\s*96|signage|ongoing/.test(titleLower)) return 4;

  // Last resort: phase 1
  return 1;
}

function assignPhases(steps: RoadmapStepType[]): globalThis.Map<string, number> {
  const phaseMap = new globalThis.Map<string, number>();

  // First pass: assign non-inferred steps
  for (const step of steps) {
    if (step.confidence !== "inferred") {
      phaseMap.set(step.step_key, getPhaseId(step, steps, phaseMap));
    }
  }

  // Second pass: assign inferred steps (now dependencies are resolved)
  for (const step of steps) {
    if (step.confidence === "inferred") {
      phaseMap.set(step.step_key, getPhaseId(step, steps, phaseMap));
    }
  }

  return phaseMap;
}

type PhaseStatus = "not_started" | "in_progress" | "completed";

function getPhaseStatus(steps: RoadmapStepType[]): PhaseStatus {
  if (steps.length === 0) return "not_started";
  const completed = steps.filter((s) => s.status === "completed").length;
  if (completed === steps.length) return "completed";
  if (completed > 0 || steps.some((s) => s.status === "in_progress")) return "in_progress";
  return "not_started";
}

const PHASE_BORDER_COLOR: Record<PhaseStatus, string> = {
  completed: "border-l-emerald-500",
  in_progress: "border-l-amber-400",
  not_started: "border-l-slate-300",
};

const PHASE_BG: Record<PhaseStatus, string> = {
  completed: "bg-emerald-50/50",
  in_progress: "bg-white",
  not_started: "bg-white",
};

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

// ── Confidence legend ─────────────────────────────────────────────────────────
function ConfidenceLegend({
  verified,
  flagged,
  inferred,
  t,
}: {
  verified: number;
  flagged: number;
  inferred: number;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <span className="inline-flex items-center gap-1.5 text-emerald-700">
        <ShieldCheck size={13} />
        {verified} {t("roadmap.verified")}
      </span>
      {flagged > 0 && (
        <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
          <Search size={13} />
          {flagged} {t("roadmap.needsAttention")}
        </span>
      )}
      {inferred > 0 && (
        <span className="inline-flex items-center gap-1.5 text-teal-600">
          <Sparkles size={13} />
          {inferred} {t("roadmap.recommendedForBusiness")}
        </span>
      )}
    </div>
  );
}

// ── Flag summary banner ───────────────────────────────────────────────────────
function FlagSummaryBanner({
  highCount,
  mediumCount,
  t,
}: {
  highCount: number;
  mediumCount: number;
  t: (key: string) => string;
}) {
  if (highCount === 0 && mediumCount === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Search size={16} className="shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            {t("roadmap.reviewBanner")}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {highCount + mediumCount} {t("roadmap.reviewDetail")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Phase section ─────────────────────────────────────────────────────────────
function PhaseSection({
  phase,
  steps,
  allSteps,
  isExpanded,
  onToggle,
}: {
  phase: PhaseDefinition;
  steps: RoadmapStepType[];
  allSteps: RoadmapStepType[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const completed = steps.filter((s) => s.status === "completed").length;
  const status = getPhaseStatus(steps);
  const sorted = steps.slice().sort((a, b) => a.step_order - b.step_order);

  return (
    <div className={`rounded-xl border overflow-hidden border-l-4 ${PHASE_BORDER_COLOR[status]} ${PHASE_BG[status]}`}>
      {/* Phase header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Phase {phase.id}
            </span>
            <span className="font-heading font-semibold text-slate-900">
              {phase.name}
            </span>
          </div>
        </div>
        <span className={`text-xs font-medium ${
          status === "completed"
            ? "text-emerald-600"
            : status === "in_progress"
              ? "text-amber-600"
              : "text-slate-400"
        }`}>
          {completed} of {steps.length} complete
        </span>
      </button>

      {/* Steps */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1">
          {sorted.map((step, index) => (
            <RoadmapStep
              key={step.id}
              step={step}
              allSteps={allSteps}
              isLast={index === sorted.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RoadmapList() {
  const { steps, flags, isLoading, isStale, loadRoadmap, generateRoadmap, regenerateRoadmap } =
    useRoadmapStore();
  const { profile } = useProfileStore();
  const { t } = useTranslation();

  // Phase grouping
  const phaseMap = steps.length > 0 ? assignPhases(steps) : new globalThis.Map<string, number>();

  const phaseGroups = PHASES.map((phase) => ({
    phase,
    steps: steps.filter((s) => phaseMap.get(s.step_key) === phase.id),
  })).filter((g) => g.steps.length > 0);

  // Determine which phase should auto-expand
  const firstIncompletePhaseId = phaseGroups.find(
    (g) => getPhaseStatus(g.steps) !== "completed"
  )?.phase.id ?? phaseGroups[0]?.phase.id ?? 1;

  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Initialize expanded state once steps load, and auto-advance when phases complete
  useEffect(() => {
    if (steps.length === 0) return;
    if (!initialized) {
      setExpandedPhases(new Set([firstIncompletePhaseId]));
      setInitialized(true);
    } else {
      // Auto-collapse completed phases and expand next incomplete
      setExpandedPhases((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const g of phaseGroups) {
          if (getPhaseStatus(g.steps) === "completed" && next.has(g.phase.id)) {
            next.delete(g.phase.id);
            changed = true;
          }
        }
        if (changed) {
          // Expand next incomplete phase
          const nextIncomplete = phaseGroups.find(
            (g) => getPhaseStatus(g.steps) !== "completed"
          );
          if (nextIncomplete) {
            next.add(nextIncomplete.phase.id);
          }
        }
        return changed ? next : prev;
      });
    }
  }, [steps, initialized, firstIncompletePhaseId]);

  const togglePhase = useCallback((phaseId: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadRoadmap(profile.id);
    }
  }, [profile?.id, loadRoadmap]);

  const completed = steps.filter((s) => s.status === "completed").length;
  const progress =
    steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  // Confidence stats
  const verified = steps.filter((s) => s.confidence === "verified").length;
  const flagged = steps.filter((s) => s.confidence === "flagged").length;
  const inferred = steps.filter((s) => s.confidence === "inferred").length;

  // Flag severity counts
  const highFlags = flags.filter((f) => f.severity === "high").length;
  const mediumFlags = flags.filter((f) => f.severity === "medium").length;

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
            {t("roadmap.noRoadmapTitle")}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {profile?.id
              ? t("roadmap.noRoadmapGenerate")
              : t("roadmap.noRoadmapProfile")}
          </p>
        </div>
        {profile?.id && (
          <button
            onClick={() => generateRoadmap(profile.id)}
            className="btn-primary"
          >
            {t("roadmap.generateBtn")}
          </button>
        )}
      </div>
    );
  }

  // ── Timeline with phases ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stale warning */}
      {isStale && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-amber-800">
            <RefreshCw size={15} className="shrink-0 text-amber-600" />
            <span>{t("roadmap.staleWarning")}</span>
          </div>
          <button
            onClick={() => profile?.id && regenerateRoadmap(profile.id)}
            disabled={isLoading}
            className="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {t("roadmap.updateBtn")}
          </button>
        </div>
      )}

      {/* Flag summary banner */}
      <FlagSummaryBanner highCount={highFlags} mediumCount={mediumFlags} t={t} />

      {/* Progress + confidence legend */}
      <div className="card p-5 space-y-3">
        <ProgressBar
          value={progress}
          label={`${completed} ${t("common.of")} ${steps.length} ${t("roadmap.stepsCompleted")}`}
          showValue
        />
        <ConfidenceLegend
          verified={verified}
          flagged={flagged}
          inferred={inferred}
          t={t}
        />
      </div>

      {/* Phase sections */}
      <div className="space-y-3">
        {phaseGroups.map(({ phase, steps: phaseSteps }) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            steps={phaseSteps}
            allSteps={steps}
            isExpanded={expandedPhases.has(phase.id)}
            onToggle={() => togglePhase(phase.id)}
          />
        ))}
      </div>
    </div>
  );
}
