import { create } from 'zustand'
import { useProfileStore } from '@/stores/profile-store'
import type { FundingMatch } from '@/types/funding'
import { computeImmediateStats } from '@/lib/funding/classify'


interface FundingStore {
  matches: FundingMatch[]
  /** Total from all matched programs (server-computed) */
  totalPotential: string
  /** Dollar total ONLY from programs you fully qualify for right now (empty if all "Varies") */
  immediateTotal: string
  /** Count of programs you fully qualify for right now */
  immediateCount: number
  isLoading: boolean
  isGenerating: boolean
  error: string | null

  loadMatches: () => Promise<void>
  generateMatches: () => Promise<void>
  toggleBookmark: (matchId: string) => Promise<void>
  toggleDismiss: (matchId: string) => Promise<void>
}

export const useFundingStore = create<FundingStore>((set, get) => ({
  matches: [],
  totalPotential: '',
  immediateTotal: '',
  immediateCount: 0,
  isLoading: false,
  isGenerating: false,
  error: null,

  loadMatches: async () => {
    const profileId = useProfileStore.getState().profile?.id
    if (!profileId) return
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/funding?profile_id=${profileId}`)
      if (!res.ok) throw new Error('Failed to load funding matches')
      const data = await res.json()
      const matches: FundingMatch[] = data.matches ?? []
      const { total, count } = computeImmediateStats(matches)
      set({
        matches,
        totalPotential: data.total_potential_funding ?? '',
        immediateTotal: total,
        immediateCount: count,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      set({ isLoading: false })
    }
  },

  generateMatches: async () => {
    const profile = useProfileStore.getState().profile
    if (!profile?.id) return
    set({ isGenerating: true, error: null })
    try {
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profile.id, force_refresh: true }),
      })
      if (!res.ok) throw new Error('Failed to generate funding matches')
      const data = await res.json()
      const matches: FundingMatch[] = data.matches ?? []
      const { total, count } = computeImmediateStats(matches)
      set({
        matches,
        totalPotential: data.total_potential_funding ?? '',
        immediateTotal: total,
        immediateCount: count,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      set({ isGenerating: false })
    }
  },

  toggleBookmark: async (matchId: string) => {
    const previous = get().matches
    const match = previous.find((m) => m.id === matchId)
    if (!match) return

    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, is_bookmarked: !m.is_bookmarked } : m
      ),
    }))

    try {
      const res = await fetch('/api/funding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, is_bookmarked: !match.is_bookmarked, is_dismissed: match.is_dismissed }),
      })
      if (!res.ok) throw new Error('Failed to update bookmark')
    } catch {
      set({ matches: previous })
    }
  },

  toggleDismiss: async (matchId: string) => {
    const previous = get().matches
    const match = previous.find((m) => m.id === matchId)
    if (!match) return

    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, is_dismissed: !m.is_dismissed } : m
      ),
    }))

    try {
      const res = await fetch('/api/funding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, is_bookmarked: match.is_bookmarked, is_dismissed: !match.is_dismissed }),
      })
      if (!res.ok) throw new Error('Failed to update dismiss')
    } catch {
      set({ matches: previous })
    }
  },
}))

