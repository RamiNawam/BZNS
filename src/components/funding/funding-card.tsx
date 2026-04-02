'use client';

import { useState } from 'react';
import {
  Bookmark, BookmarkCheck, CheckCircle2, XCircle,
  ExternalLink, ChevronDown, ChevronUp, Sparkles, Loader2,
} from 'lucide-react';
import type { FundingMatch, ProgramType } from '@/types/funding';
import { useFundingStore } from '@/stores/funding-store';

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

const TYPE_LABEL: Record<ProgramType, string> = {
  loan:       'Loan',
  grant:      'Grant',
  tax_credit: 'Tax Credit',
  mentorship: 'Mentorship',
};

function matchLabel(score: number): { text: string; cls: string } {
  if (score >= 80) return { text: 'Strong Match', cls: 'badge bg-teal-100 text-teal-700' };
  if (score >= 50) return { text: 'Good Match',   cls: 'badge bg-amber-100 text-amber-700' };
  return               { text: 'Partial Match',  cls: 'badge bg-slate-100 text-slate-500' };
}

function eligibilityLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FundingCard({ match }: FundingCardProps) {
  const { toggleBookmark } = useFundingStore();
  const [expanded, setExpanded] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const label = matchLabel(match.match_score);

  async function handleExplain(e: React.MouseEvent) {
    e.stopPropagation();
    if (explanation) { setExplanation(null); return; }
    setExplaining(true);
    try {
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: match.profile_id, explain_program: match.program_key }),
      });
      const data = await res.json();
      setExplanation(data.explanation ?? 'No explanation available.');
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-heading font-semibold text-sm text-slate-900 leading-snug">
                    {match.program_name}
                  </span>
                  <span className={TYPE_BADGE[match.program_type]}>
                    {TYPE_LABEL[match.program_type]}
                  </span>
                  <span className={label.cls}>{label.text}</span>
                </div>

                {match.amount_description && (
                  <p className="text-sm font-semibold text-emerald-600 mb-1">
                    {match.amount_description}
                  </p>
                )}

                {match.summary && (
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {match.summary}
                  </p>
                )}
              </div>

              {/* Bookmark + chevron */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(match.id); }}
                  aria-label={match.is_bookmarked ? 'Remove bookmark' : 'Bookmark this program'}
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

          {/* Eligibility checklist */}
          {match.eligibility_details && Object.keys(match.eligibility_details).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Your eligibility
              </p>
              <ul className="space-y-1.5">
                {Object.entries(match.eligibility_details).map(([key, val]) => (
                  <li key={key} className="flex items-center gap-2.5 text-sm">
                    {val
                      ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      : <XCircle size={14} className="text-red-400 shrink-0" />
                    }
                    <span className={val ? 'text-slate-700' : 'text-slate-400'}>
                      {eligibilityLabel(key)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI explanation */}
          {explanation && (
            <div className="card-brand rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Sparkles size={11} /> AI Explanation
              </p>
              <p className="text-sm text-brand-800 leading-relaxed">{explanation}</p>
            </div>
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
                Apply now <ExternalLink size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={handleExplain}
              disabled={explaining}
              className="btn-secondary btn-sm gap-1.5 inline-flex"
            >
              {explaining ? (
                <><Loader2 size={12} className="animate-spin" /> Explaining…</>
              ) : explanation ? (
                'Hide explanation'
              ) : (
                <><Sparkles size={12} /> Explain this program</>
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
                Learn more <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
