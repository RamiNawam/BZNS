// ============================================================
// CONTROLLER: POST   /api/cache — seed demo account cache
//             GET    /api/cache — get cache status
//             DELETE /api/cache — purge expired or specific profile
// Thin layer: validate input → call service → return JSON
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '@/services/cache.service'

export async function GET(_req: NextRequest) {
  try {
    const status = await CacheService.getStatus()
    return NextResponse.json(status)
  } catch (err) {
    console.error('[GET /api/cache]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id } = body

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    await CacheService.seedDemoAccount(profile_id)
    return NextResponse.json({ message: `Demo cache seeded for profile: ${profile_id}` })
  } catch (err) {
    console.error('[POST /api/cache]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile_id = searchParams.get('profile_id')

    if (profile_id) {
      await CacheService.invalidateForProfile(profile_id)
      return NextResponse.json({ message: `Cache invalidated for profile: ${profile_id}` })
    }

    await CacheService.purgeExpired()
    return NextResponse.json({ message: 'Expired cache entries purged' })
  } catch (err) {
    console.error('[DELETE /api/cache]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
