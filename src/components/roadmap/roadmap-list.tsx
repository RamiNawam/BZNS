'use client';

import { useEffect } from 'react';
import { useRoadmapStore } from '@/stores/roadmap-store';
import RoadmapStep from './roadmap-step';
import { SkeletonCard } from '@/components/ui/skeleton';
import ProgressBar from '@/components/ui/progress-bar';

export default function RoadmapList() {
  const { steps, isLoading, loadRoadmap } = useRoadmapStore();

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const completed = steps.filter((s) => s.status === 'completed').length;
  const progress = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">🗺️</p>
        <p className="font-medium">No roadmap yet</p>
        <p className="text-sm mt-1">Complete your business profile to generate a personalised roadmap.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        value={progress}
        label={`${completed} of ${steps.length} steps completed`}
        showValue
      />
      <div className="space-y-3">
        {steps
          .slice()
          .sort((a, b) => a.step_order - b.step_order)
          .map((step) => (
            <RoadmapStep key={step.id} step={step} />
          ))}
      </div>
    </div>
  );
}
