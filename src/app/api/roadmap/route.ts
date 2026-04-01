// ============================================================
// CONTROLLER: POST  /api/roadmap — generate roadmap for a profile
//             GET   /api/roadmap — fetch existing roadmap steps
//             PATCH /api/roadmap — update a step's status
// Thin layer: validate input → call service → return JSON
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { RoadmapService } from '@/services/roadmap.service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const steps = await RoadmapService.getByProfileId(profile_id)
    return NextResponse.json({ steps })
  } catch (err) {
    console.error('[GET /api/roadmap]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id } = body

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const steps = await RoadmapService.generate(profile_id)
    return NextResponse.json({ steps }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/roadmap]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { step_id, profile_id, status, notes } = body

    if (!step_id || !profile_id || !status) {
      return NextResponse.json({ error: 'step_id, profile_id, and status are required' }, { status: 400 })
    }

    const updatedStep = await RoadmapService.updateStepStatus(step_id, profile_id, { status, notes })
    return NextResponse.json({ step: updatedStep })
  } catch (err: unknown) {
    console.error('[PATCH /api/roadmap]', err)
    if (err instanceof Error && err.message.startsWith('Cannot complete step')) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
