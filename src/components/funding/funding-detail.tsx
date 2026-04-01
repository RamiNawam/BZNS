import type { FundingProgram } from '@/types/funding';

interface FundingDetailProps {
  program: FundingProgram;
  rationale?: string;
}

export default function FundingDetail({ program, rationale }: FundingDetailProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
      <p className="text-sm text-gray-600">{program.description_en}</p>

      {rationale && (
        <div className="rounded-lg bg-brand-50 p-3">
          <p className="text-xs font-semibold text-brand-700 mb-1">Why this matches you</p>
          <p className="text-sm text-brand-800">{rationale}</p>
        </div>
      )}

      {program.funding_details && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Details</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(program.funding_details).map(([key, val]) => (
              <div key={key}>
                <dt className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                <dd className="font-medium text-gray-900">{String(val)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {program.website && (
        <a
          href={program.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          Visit official website ↗
        </a>
      )}
    </div>
  );
}
