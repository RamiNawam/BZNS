// ============================================================
// CONTROLLER: POST /api/profile  — create profile from intake
//             GET  /api/profile  — fetch current user's profile
// Thin layer: validate input → call service → return JSON
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { ProfileService } from '@/services/profile.service'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await ProfileService.getByUserId(user.id)
    if (!profile) return NextResponse.json({ profile: null }, { status: 200 })

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[GET /api/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { answers } = body

    if (!answers) return NextResponse.json({ error: 'answers required' }, { status: 400 })

    const profile = await ProfileService.createFromIntake(user.id, answers)
    return NextResponse.json({ profile }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, updates } = body

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const profile = await ProfileService.update(profile_id, updates)
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[PATCH /api/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
