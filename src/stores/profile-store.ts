import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types/profile';

// Intake answers collected from the wizard (one field per question)
export interface IntakeFormState {
  // Classification questions (we classify, user doesn't pick)
  business_name: string
  business_activity: string        // food | services | professional | products | trades | children
  work_location: string            // home | commercial | client_sites | online
  pricing_model: string            // per_item | per_hour | per_session | per_project | subscription
  // Legal roadmap questions
  business_idea: string
  location: string
  borough: string
  is_home_based: boolean
  age: number | null
  immigration_status: string
  expected_monthly_revenue: number | null
  has_partners: boolean
  languages: string[]
  preferred_language: string
}

interface ProfileStore {
  // The saved profile from the DB (set after intake is submitted)
  profile: Profile | null

  // The in-progress intake form answers (before submission)
  intakeForm: Partial<IntakeFormState>

  isLoading: boolean
  error: string | null

  // Update a single intake form field as the user moves through the wizard
  updateIntakeField: <K extends keyof IntakeFormState>(key: K, value: IntakeFormState[K]) => void

  // Submit intake → POST /api/profile → redirect to dashboard
  submitIntake: () => Promise<void>

  // Load existing profile from DB (called on dashboard mount)
  loadProfile: () => Promise<void>

  // Set profile directly (used by server-fetched data)
  setProfile: (profile: Profile) => void

  // Patch specific profile fields (called after roadmap step completion)
  updateProfile: (updates: Partial<Profile>) => Promise<void>

  clearProfile: () => void
}

const DEFAULT_INTAKE: Partial<IntakeFormState> = {
  business_name: '',
  business_activity: '',
  work_location: '',
  pricing_model: '',
  business_idea: '',
  location: 'montreal',
  borough: '',
  is_home_based: true,
  age: null,
  immigration_status: 'citizen',
  expected_monthly_revenue: null,
  has_partners: false,
  languages: ['en'],
  preferred_language: 'en',
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      intakeForm: DEFAULT_INTAKE,
      isLoading: false,
      error: null,

      setProfile: (profile) => set({ profile }),

      updateIntakeField: (key, value) =>
        set((state) => ({
          intakeForm: { ...state.intakeForm, [key]: value },
        })),

      // Called when user hits "Save & Generate Roadmap" on the last intake step
      submitIntake: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: get().intakeForm }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error ?? 'Failed to save profile')
          }

          const data = await response.json()
          set({ profile: data.profile, intakeForm: DEFAULT_INTAKE })

          // Redirect to dashboard — intake is complete
          window.location.href = '/dashboard'
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Unknown error' })
        } finally {
          set({ isLoading: false })
        }
      },

      loadProfile: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/profile')
          if (!response.ok) throw new Error('Failed to load profile')
          const data = await response.json()
          set({ profile: data.profile })
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Unknown error' })
        } finally {
          set({ isLoading: false })
        }
      },

      updateProfile: async (updates) => {
        const { profile } = get()
        if (!profile) return
        try {
          const response = await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_id: profile.id, updates }),
          })
          if (!response.ok) return
          const data = await response.json()
          set({ profile: data.profile })
        } catch {
          // silent — profile update is a background sync, not user-initiated
        }
      },

      clearProfile: () => set({ profile: null, intakeForm: DEFAULT_INTAKE }),
    }),
    {
      name: 'bzns-profile',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>
        if (version < 2) {
          // v2: replaced business_category with classification questions
          return {
            ...state,
            intakeForm: DEFAULT_INTAKE,
          }
        }
        return state
      },
    }
  )
);
