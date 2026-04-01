'use client';

import { useState } from 'react';
import type { RoadmapStep as RoadmapStepType } from '@/types/roadmap';
import { useRoadmapStore } from '@/stores/roadmap-store';
import StepDetail from './step-detail';

interface RoadmapStepProps {
  step: RoadmapStepType;
}

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  skipped:     'bg-gray-100 text-gray-400',
};

export default function RoadmapStep({ step }: RoadmapStepProps) {
  const [expanded, setExpanded] = useState(false);
  const { updateStepStatus } = useRoadmapStore();

  const isCompleted = step.status === 'completed';

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all ${isCompleted ? 'opacity-60' : ''}`}>
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateStepStatus(step.id, isCompleted ? 'pending' : 'completed');
          }}
          className={`mt-0.5 h-5 w-5 rounded border-2 flex-shrink-0 transition-colors ${
            isCompleted
              ? 'border-teal-600 bg-teal-600 text-white'
              : 'border-gray-300 hover:border-teal-400'
          }`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && <span className="text-xs leading-none">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {step.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[step.status] ?? STATUS_BADGE.pending}`}>
              {step.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{step.description}</p>
          <div className="flex gap-3 mt-1">
            {step.estimated_timeline && (
              <span className="text-xs text-gray-400">⏱ {step.estimated_timeline}</span>
            )}
            {step.estimated_cost && (
              <span className="text-xs text-gray-400">💰 {step.estimated_cost}</span>
            )}
          </div>
        </div>

        <span className="text-gray-400 text-sm flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && <StepDetail step={step} />}
    </div>
  );
}
