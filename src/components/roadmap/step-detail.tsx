import type { RoadmapStep } from '@/types/roadmap';

interface StepDetailProps {
  step: RoadmapStep;
}

export default function StepDetail({ step }: StepDetailProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      {step.why_needed && (
        <div className="rounded-lg bg-teal-50 p-3">
          <p className="text-xs font-semibold text-teal-700 mb-1">Why this matters</p>
          <p className="text-sm text-teal-800">{step.why_needed}</p>
        </div>
      )}

      {step.required_documents && step.required_documents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Documents required
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {step.required_documents.map((doc) => (
              <li key={doc} className="text-sm text-gray-600">{doc}</li>
            ))}
          </ul>
        </div>
      )}

      {step.government_url && (
        <a
          href={step.government_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline"
        >
          Official government page ↗
        </a>
      )}
    </div>
  );
}
