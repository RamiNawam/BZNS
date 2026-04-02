import { create } from 'zustand';
import type { RoadmapStep, StepStatus } from '@/types/roadmap';

interface RoadmapStore {
  steps: RoadmapStep[];
  isLoading: boolean;
  error: string | null;

  loadRoadmap: () => Promise<void>;
  generateRoadmap: (profileId: string) => Promise<void>;
  updateStepStatus: (stepId: string, status: StepStatus) => Promise<void>;
}

export const useRoadmapStore = create<RoadmapStore>((set, get) => ({
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

  updateStepStatus: async (stepId, status) => {
    // Capture previous state for rollback
    const previousSteps = get().steps;

    // Optimistic update — immediate UI response
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? { ...s, status, completed_at: status === 'completed' ? new Date().toISOString() : null }
          : s
      ),
    }));

    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId, status }),
      });
      if (!res.ok) throw new Error('Failed to update step');
      const { step } = await res.json();
      // Sync with authoritative server response
      set((state) => ({
        steps: state.steps.map((s) => (s.id === step.id ? step : s)),
      }));
    } catch {
      // Revert to previous state on failure
      set({ steps: previousSteps });
    }
  },
}));
