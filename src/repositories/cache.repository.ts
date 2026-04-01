// ============================================================
// CACHE REPOSITORY — all DB operations for the response_cache table
// Used to pre-bake Claude responses for demo day.
// No business logic here. Just Supabase queries.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'

export const CacheRepository = {

  // Get a cached response by key (returns null if expired or missing)
  async get<T>(cache_key: string): Promise<T | null> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('response_cache')
      .select('response_data, expires_at')
      .eq('cache_key', cache_key)
      .single()

    if (error || !data) return null

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      await CacheRepository.delete(cache_key)
      return null
    }

    return data.response_data as T
  },

  // Set a cache entry — upserts so re-running overwrites
  async set<T>(cache_key: string, response_data: T, ttlHours: number = 24): Promise<void> {
    const supabase = createServerClient()
    const expires_at = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()
    const { error } = await supabase
      .from('response_cache')
      .upsert({ cache_key, response_data, expires_at }, { onConflict: 'cache_key' })
    if (error) throw new Error(`CacheRepository.set failed: ${error.message}`)
  },

  // Delete a specific cache entry
  async delete(cache_key: string): Promise<void> {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('response_cache')
      .delete()
      .eq('cache_key', cache_key)
    if (error) throw new Error(`CacheRepository.delete failed: ${error.message}`)
  },

  // Purge all expired entries (run this on a schedule or on deploy)
  async purgeExpired(): Promise<void> {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('response_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
    if (error) throw new Error(`CacheRepository.purgeExpired failed: ${error.message}`)
  },

  // Check if a key exists and is still valid
  async exists(cache_key: string): Promise<boolean> {
    const result = await CacheRepository.get(cache_key)
    return result !== null
  },
}
