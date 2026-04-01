'use client';

import { useState } from 'react';
import type { RoadmapStep as RoadmapStepType } from '@/types/roadmap';
import { useRoadmapStore } from '@/stores/roadmap-store';
import Badge from '@/components/ui/badge';
import StepDetail from './step-detail';

interface RoadmapStepProps {
  step: RoadmapStepType;
}

const categoryColors = {
  registration: 'info',
  permits: 'warning',
  tax: 'danger',
  banking: 'success',
  insurance: 'default',
  other: 'default',
} as const;

export default function RoadmapStep({ step }: RoadmapStepProps) {
  const [expanded, setExpanded] = useState(false);
  const { updateStepStatus } = useRoadmapStore();

  const isCompleted = step.status === 'completed';

  return (
    <div className={`card transition-all ${isCompleted ? 'opacity-60' : ''}`}>
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
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-gray-300 hover:border-brand-400'
          }`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && <span className="text-xs">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {step.title_en}
            </span>
            <Badge variant={categoryColors[step.category] ?? 'default'}>
              {step.category}
            </Badge>
          </div>
          {step.estimatedTimeHours && (
            <span className="text-xs text-gray-400 mt-0.5">
              ~{step.estimatedTimeHours}h
            </span>
          )}
        </div>

        <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && <StepDetail step={step} />}
    </div>
  );
}
