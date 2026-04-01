import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, ProfileFormData } from '@/types/profile';

interface ProfileStore {
  profile: Partial<UserProfile> | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  setProfile: (profile: Partial<UserProfile>) => void;
  updateField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
  saveProfile: () => Promise<void>;
  loadProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isDirty: false,
      isLoading: false,
      error: null,

      setProfile: (profile) => set({ profile, isDirty: false }),

      updateField: (key, value) =>
        set((state) => ({
          profile: { ...state.profile, [key]: value },
          isDirty: true,
        })),

      saveProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(get().profile),
          });
          if (!response.ok) throw new Error('Failed to save profile');
          const data = await response.json();
          set({ profile: data.profile ?? get().profile, isDirty: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Unknown error' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/profile');
          if (!response.ok) throw new Error('Failed to load profile');
          const data = await response.json();
          set({ profile: data.profile, isDirty: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Unknown error' });
        } finally {
          set({ isLoading: false });
        }
      },

      clearProfile: () => set({ profile: null, isDirty: false }),
    }),
    { name: 'bzns-profile' }
  )
);
