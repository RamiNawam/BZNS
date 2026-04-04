'use client';

import { useState } from 'react';
import {
  Bookmark, BookmarkCheck, CheckCircle2, XCircle,
  ExternalLink, ChevronDown, ChevronUp, Sparkles, Loader2,
  ArrowRight, AlertTriangle, ClipboardList, FileText,
} from 'lucide-react';
import type { FundingMatch, FundingExplanation, ProgramType } from '@/types/funding';
import type { Profile } from '@/types/profile';
import { useFundingStore } from '@/stores/funding-store';
import { useProfileStore } from '@/stores/profile-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { localizeProgramName, localizeAmount, localizeDocument } from '@/lib/funding/locale';

interface FundingCardProps {
  match: FundingMatch;
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const fill = (score / 100) * c;
  const color = score >= 80 ? '#0d9488' : score >= 50 ? '#f59e0b' : '#94a3b8';
  return (
    <svg
      width="52" height="52" viewBox="0 0 52 52"
      aria-label={`Match score: ${score}/100`}
      className="shrink-0"
    >
      <circle cx="26" cy="26" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
      <circle
        cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${c}`} strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<ProgramType, string> = {
  loan:       'badge bg-blue-100 text-blue-700',
  grant:      'badge bg-emerald-100 text-emerald-700',
  tax_credit: 'badge bg-purple-100 text-purple-700',
  mentorship: 'badge bg-amber-100 text-amber-700',
};

function useTypeLabel(): Record<ProgramType, string> {
  const { t } = useTranslation();
  return {
    loan:       t('funding.types.loan'),
    grant:      t('funding.types.grant'),
    tax_credit: t('funding.types.taxCredit'),
    mentorship: t('funding.types.mentorship'),
  };
}

function useMatchLabel() {
  const { t } = useTranslation();
  return (score: number): { text: string; cls: string } => {
    if (score >= 80) return { text: t('funding.matchLabels.strong'), cls: 'badge bg-teal-100 text-teal-700' };
    if (score >= 50) return { text: t('funding.matchLabels.good'),   cls: 'badge bg-amber-100 text-amber-700' };
    return               { text: t('funding.matchLabels.partial'),  cls: 'badge bg-slate-100 text-slate-500' };
  };
}

const IMPACT_BADGE: Record<string, string> = {
  high:   'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-slate-100 text-slate-500',
};

// ── Requirements panel ────────────────────────────────────────────────────────

interface RequirementMetaStatic {
  mandatory: boolean;
  gatedBy?: keyof Profile;
  hasRoadmapHint?: boolean;
}

const REQUIREMENT_META_STATIC: Record<string, RequirementMetaStatic> = {
  age_eligible:                { mandatory: true },
  location_eligible:           { mandatory: true },
  immigration_status_eligible: { mandatory: true },
  business_type_eligible:      { mandatory: true },
  business_stage_eligible:     { mandatory: false, gatedBy: 'has_neq', hasRoadmapHint: true },
  demographic_match:           { mandatory: false },
};

function RequirementsPanel({
  eligibilityDetails,
  profile,
}: {
  eligibilityDetails: Record<string, boolean>;
  profile: Profile | null;
}) {
  const { t } = useTranslation();
  const entries = Object.entries(eligibilityDetails);
  const mandatory = entries.filter(([k]) => REQUIREMENT_META_STATIC[k]?.mandatory !== false);
  const optional  = entries.filter(([k]) => REQUIREMENT_META_STATIC[k]?.mandatory === false);

  const roadmapHints = entries.filter(([k, v]) => {
    if (v) return false;
    const meta = REQUIREMENT_META_STATIC[k];
    if (!meta?.hasRoadmapHint || !meta.gatedBy) return false;
    return profile?.[meta.gatedBy] === false;
  });

  const label = (key: string) =>
    t(`funding.reqLabels.${key}`) !== `funding.reqLabels.${key}`
      ? t(`funding.reqLabels.${key}`)
      : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {t('funding.requirements')}
      </p>

      {/* Mandatory */}
      <ul className="space-y-1.5 mb-3">
        {mandatory.map(([key, val]) => (
          <li key={key} className="flex items-center gap-2.5 text-sm">
            {val
              ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              : <XCircle      size={14} className="text-red-400 shrink-0" />
            }
            <span className={val ? 'text-slate-700' : 'text-red-600 font-medium'}>
              {label(key)}
            </span>
            {!val && (
              <span className="ml-auto text-[10px] font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                {t('funding.required')}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Score boosters */}
      {optional.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            {t('funding.scoreBoosters')}
          </p>
          <ul className="space-y-1.5">
            {optional.map(([key, val]) => (
              <li key={key} className="flex items-center gap-2.5 text-sm">
                {val
                  ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                }
                <span className={val ? 'text-slate-700' : 'text-slate-400'}>{label(key)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Roadmap hints for fixable gaps */}
      {roadmapHints.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 flex items-start gap-2">
          <ClipboardList size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-1">{t('funding.improveViaRoadmap')}</p>
            {roadmapHints.map(([key]) => (
              <p key={key} className="text-xs text-amber-600 leading-relaxed">
                {t('funding.roadmapHintNeq')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Structured AI explanation ─────────────────────────────────────────────────

function ExplanationPanel({ exp }: { exp: FundingExplanation }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-200 bg-brand-100/60">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 uppercase tracking-wide">
          <Sparkles size={11} /> {t('funding.aiAnalysis')}
        </span>
        <span className="text-xs text-brand-500 font-medium">{t('funding.aiVerified')}</span>
      </div>

      <div className="p-4 space-y-4">

        {/* 1 — Program overview */}
        <p className="text-sm text-brand-900 leading-relaxed">{exp.program_overview}</p>

        {/* 2 — Eligible factors */}
        {exp.eligible_factors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
              {t('funding.whyQualify')}
            </p>
            <ul className="space-y-2">
              {exp.eligible_factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{f.label}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${IMPACT_BADGE[f.impact] ?? IMPACT_BADGE.low}`}>
                        {t(`funding.impact${f.impact.charAt(0).toUpperCase()}${f.impact.slice(1)}`)} {t('funding.impact')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3 — Missing factors */}
        {exp.missing_factors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
              {t('funding.whatRaiseScore')}
            </p>
            <ul className="space-y-2">
              {exp.missing_factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700">{f.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4 — Next step */}
        <div className="rounded-lg bg-white border border-brand-200 px-3.5 py-3 flex items-start gap-2.5">
          <ArrowRight size={14} className="text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-0.5">{t('funding.nextStep')}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{exp.next_step}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FundingCard({ match }: FundingCardProps) {
  const { toggleBookmark } = useFundingStore();
  const profile = useProfileStore((s) => s.profile);
  const { t, locale } = useTranslation();
  const TYPE_LABEL = useTypeLabel();
  const matchLabel = useMatchLabel();
  const [expanded, setExpanded] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<FundingExplanation | null>(null);

  const label = matchLabel(match.match_score);

  async function handleExplain(e: React.MouseEvent) {
    e.stopPropagation();
    if (explanation) { setExplanation(null); return; }
    setExplaining(true);
    try {
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: match.profile_id,
          explain_program: match.program_key,
          match_score: match.match_score,
          eligibility_details: match.eligibility_details,
        }),
      });
      const data = await res.json();
      if (data.explanation && data.explanation.program_overview) {
        setExplanation(data.explanation as FundingExplanation);
      }
    } finally {
      setExplaining(false);
    }
  }

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${
      expanded ? 'shadow-card-hover border-slate-300' : 'hover:shadow-card-hover hover:border-slate-300'
    }`}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full text-left p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
      >
        <div className="flex items-start gap-4">
          <ScoreRing score={match.match_score} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-heading font-semibold text-sm text-slate-900 leading-snug">
                    {localizeProgramName(match.program_key, match.program_name, locale)}
                  </span>
                  <span className={TYPE_BADGE[match.program_type]}>
                    {TYPE_LABEL[match.program_type]}
                  </span>
                  <span className={label.cls}>{label.text}</span>
                </div>
                {match.amount_description && (
                  <p className="text-sm font-semibold text-emerald-600">
                    {localizeAmount(match.amount_description, locale)}
                  </p>
                )}
              </div>

              {/* Bookmark + chevron */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(match.id); }}
                  aria-label={match.is_bookmarked ? t('funding.removeBookmark') : t('funding.bookmarkProgram')}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {match.is_bookmarked
                    ? <BookmarkCheck size={16} className="text-brand-600" />
                    : <Bookmark size={16} />
                  }
                </button>
                <div className="text-slate-400">
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">

          {/* Requirements — always visible, roadmap hints for fixable gaps */}
          {match.eligibility_details && Object.keys(match.eligibility_details).length > 0 && (
            <RequirementsPanel
              eligibilityDetails={match.eligibility_details}
              profile={profile}
            />
          )}

          {/* What you'll need to apply */}
          {match.documents_required && match.documents_required.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileText size={11} /> {t('funding.whatNeedToApply')}
              </p>
              <ul className="space-y-1.5">
                {match.documents_required.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                    {localizeDocument(doc, locale)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Structured AI explanation */}
          {explanation && (
            <ExplanationPanel exp={explanation} />
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {match.application_url && (
              <a
                href={match.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-sm gap-1.5 inline-flex"
                onClick={(e) => e.stopPropagation()}
              >
                {t('funding.applyNow')} <ExternalLink size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={handleExplain}
              disabled={explaining}
              className="btn-secondary btn-sm gap-1.5 inline-flex"
            >
              {explaining ? (
                <><Loader2 size={12} className="animate-spin" /> {t('funding.analysing')}</>
              ) : explanation ? (
                t('funding.hideAnalysis')
              ) : (
                <><Sparkles size={12} /> {t('funding.analyseEligibility')}</>
              )}
            </button>
            {match.source_url && match.source_url !== match.application_url && (
              <a
                href={match.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-sm gap-1.5 inline-flex"
                onClick={(e) => e.stopPropagation()}
              >
                {t('funding.learnMore')} <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
