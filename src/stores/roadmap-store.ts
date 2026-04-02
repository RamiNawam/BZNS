import { create } from "zustand";
import type { RoadmapStep, StepStatus } from "@/types/roadmap";

interface RoadmapStore {
  steps: RoadmapStep[];
  isLoading: boolean;
  error: string | null;

  loadRoadmap: (profileId: string) => Promise<void>;
  generateRoadmap: (profileId: string) => Promise<void>;
  updateStepStatus: (
    stepId: string,
    profileId: string,
    status: StepStatus,
  ) => Promise<void>;
}

export const useRoadmapStore = create<RoadmapStore>((set, get) => ({
  steps: [],
  isLoading: false,
  error: null,

  loadRoadmap: async (profileId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/roadmap?profile_id=${profileId}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to load roadmap");
      }
      const data = await response.json();
      set({ steps: data.steps ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      set({ isLoading: false });
    }
  },

  generateRoadmap: async (profileId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to generate roadmap");
      }
      const data = await response.json();
      set({ steps: data.steps ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      set({ isLoading: false });
    }
  },

  updateStepStatus: async (stepId, profileId, status) => {
    const previousSteps = get().steps;

    // Optimistic update
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              status,
              completed_at:
                status === "completed" ? new Date().toISOString() : null,
            }
          : s,
      ),
    }));

    try {
      const response = await fetch("/api/roadmap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_id: stepId,
          profile_id: profileId,
          status,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to update step");
      }

      const data = await response.json();

      // Sync with server response
      set((state) => ({
        steps: state.steps.map((s) => (s.id === stepId ? data.step : s)),
      }));
    } catch (err) {
      // Rollback on failure
      set({
        steps: previousSteps,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
}));
