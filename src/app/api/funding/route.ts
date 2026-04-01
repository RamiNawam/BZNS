import { NextRequest, NextResponse } from 'next/server';
// import { scorePrograms } from '@/lib/funding/scorer';

/**
 * GET /api/funding — Fetch funding matches for the current user
 * POST /api/funding — Re-score funding programs against an updated profile
 */

export async function GET(_req: NextRequest) {
  // TODO: Fetch pre-scored funding_matches from Supabase for the authenticated user

  return NextResponse.json({
    message: 'Funding matches endpoint stub',
    matches: [],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: Load all funding JSON files from the knowledge base
  // TODO: Score each program against the user's profile using scorer.ts
  // TODO: Persist top matches in funding_matches table
  // TODO: Return scored results

  return NextResponse.json({
    message: 'Funding scoring triggered (stub)',
    received: body,
    matches: [],
  });
}
