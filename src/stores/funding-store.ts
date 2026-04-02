import { create } from 'zustand'
import { useProfileStore } from '@/stores/profile-store'
import type { FundingMatch } from '@/types/funding'

interface FundingStore {
  matches: FundingMatch[]
  totalPotential: string
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
      set({ matches: data.matches ?? [], totalPotential: data.total_potential_funding ?? '' })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      set({ isLoading: false })
    }
  },

  generateMatches: async () => {
    const profileId = useProfileStore.getState().profile?.id
    if (!profileId) return
    set({ isGenerating: true, error: null })
    try {
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      })
      if (!res.ok) throw new Error('Failed to generate funding matches')
      const data = await res.json()
      set({ matches: data.matches ?? [], totalPotential: data.total_potential_funding ?? '' })
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
