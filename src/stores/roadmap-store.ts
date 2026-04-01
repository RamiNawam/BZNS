import { create } from 'zustand';
import type { RoadmapStep, StepStatus } from '@/types/roadmap';

interface RoadmapStore {
  steps: RoadmapStep[];
  isLoading: boolean;
  error: string | null;

  loadRoadmap: () => Promise<void>;
  generateRoadmap: (profileId: string) => Promise<void>;
  updateStepStatus: (stepId: string, status: StepStatus) => void;
}

export const useRoadmapStore = create<RoadmapStore>((set) => ({
  steps: [],
  isLoading: false,
  error: null,

  loadRoadmap: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/roadmap');
      if (!response.ok) throw new Error('Failed to load roadmap');
      const data = await response.json();
      set({ steps: data.steps ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  generateRoadmap: async (profileId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      if (!response.ok) throw new Error('Failed to generate roadmap');
      const data = await response.json();
      set({ steps: data.steps ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateStepStatus: (stepId, status) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === stepId
          ? { ...step, status, completedAt: status === 'completed' ? new Date().toISOString() : null }
          : step
      ),
    })),
}));
