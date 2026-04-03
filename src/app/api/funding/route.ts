// ============================================================
// CONTROLLER: POST  /api/funding — score funding programs for a profile
//             GET   /api/funding — fetch existing funding matches
//             PATCH /api/funding — bookmark or dismiss a match
// Thin layer: validate input → call service → return JSON
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { FundingService } from '@/services/funding.service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const matches = await FundingService.getByProfileId(profile_id)
    const total_potential_funding = FundingService.computeTotalFromMatches(matches)
    return NextResponse.json({ matches, total_potential_funding })
  } catch (err) {
    console.error('[GET /api/funding]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, explain_program, match_score, eligibility_details } = body

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    if (explain_program) {
      const explanation = await FundingService.explainProgram(
        profile_id,
        explain_program,
        typeof match_score === 'number' ? match_score : undefined,
        eligibility_details ?? null,
      )
      return NextResponse.json({ explanation })
    }

    const { force_refresh } = body
    const result = await FundingService.scoreForProfile(profile_id, !!force_refresh)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[POST /api/funding]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { match_id, is_bookmarked, is_dismissed } = body

    if (!match_id) return NextResponse.json({ error: 'match_id required' }, { status: 400 })

    const updated = await FundingService.updateMatch(match_id, { is_bookmarked, is_dismissed })
    return NextResponse.json({ match: updated })
  } catch (err) {
    console.error('[PATCH /api/funding]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
