import type { RoadmapStep } from '@/types/roadmap';

interface StepDetailProps {
  step: RoadmapStep;
}

export default function StepDetail({ step }: StepDetailProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      <p className="text-sm text-gray-600">{step.description_en}</p>

      {step.links && step.links.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Useful links
          </p>
          <ul className="space-y-1">
            {step.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
