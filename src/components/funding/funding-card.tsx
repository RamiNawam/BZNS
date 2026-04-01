'use client';

import { useState } from 'react';
import type { FundingMatch } from '@/types/funding';
import Badge from '@/components/ui/badge';

interface FundingCardProps {
  match: FundingMatch;
}

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  loan:       'Loan',
  grant:      'Grant',
  tax_credit: 'Tax Credit',
  mentorship: 'Mentorship',
};

export default function FundingCard({ match }: FundingCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    match.match_score >= 80
      ? 'text-green-600'
      : match.match_score >= 50
      ? 'text-yellow-600'
      : 'text-gray-400';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{match.program_name}</span>
            <Badge variant="default">{PROGRAM_TYPE_LABELS[match.program_type] ?? match.program_type}</Badge>
            {match.match_score >= 80 && (
              <Badge variant="success">Strong Match</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {match.summary}
          </p>
          {match.amount_description && (
            <p className="text-xs font-medium text-teal-700 mt-1">{match.amount_description}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <div className={`text-xl font-bold ${scoreColor}`}>{match.match_score}</div>
          <div className="text-xs text-gray-400">/ 100</div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {match.summary && (
            <p className="text-sm text-gray-600">{match.summary}</p>
          )}
          {match.eligibility_details && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Your eligibility
              </p>
              <ul className="space-y-1">
                {Object.entries(match.eligibility_details).map(([key, val]) => (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    <span>{val ? '✅' : '❌'}</span>
                    <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            {match.application_url && (
              <a
                href={match.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-600 hover:underline"
              >
                Apply ↗
              </a>
            )}
            {match.source_url && (
              <a
                href={match.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:underline"
              >
                Learn more ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
