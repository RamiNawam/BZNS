'use client';

import { useState } from 'react';
import type { FundingMatch } from '@/types/funding';
import Badge from '@/components/ui/badge';
import FundingDetail from './funding-detail';

interface FundingCardProps {
  match: FundingMatch;
}

export default function FundingCard({ match }: FundingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const program = match.program;

  const scoreColor =
    match.score >= 80 ? 'success' : match.score >= 50 ? 'warning' : 'default';

  return (
    <div className="card">
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              {program?.name_en ?? match.programId}
            </span>
            {match.recommended && (
              <Badge variant="success">Recommended</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {program?.description_en ?? match.rationale_en}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <div className={`text-xl font-bold ${scoreColor === 'success' ? 'text-green-600' : scoreColor === 'warning' ? 'text-yellow-600' : 'text-gray-400'}`}>
            {match.score}
          </div>
          <div className="text-xs text-gray-400">/ 100</div>
        </div>
      </div>

      {expanded && program && <FundingDetail program={program} rationale={match.rationale_en} />}
    </div>
  );
}
