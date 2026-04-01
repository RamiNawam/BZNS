import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
// import { generateRoadmap } from '@/lib/claude/client';

/**
 * GET /api/roadmap — Fetch the user's roadmap steps
 * POST /api/roadmap — Generate a new roadmap based on the user's profile
 */

export async function GET(_req: NextRequest) {
  // TODO: Fetch roadmap_steps from Supabase for the authenticated user

  return NextResponse.json({
    message: 'Roadmap endpoint stub',
    steps: [],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profileId } = body;

  // TODO: Fetch profile from Supabase
  // TODO: Load relevant knowledge base files (registration, permits, etc.)
  // TODO: Call Claude to generate personalised roadmap steps
  // TODO: Persist steps in roadmap_steps table

  return NextResponse.json({
    message: 'Roadmap generation triggered (stub)',
    profileId,
    steps: [],
  });
}
