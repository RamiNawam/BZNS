import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/profile — Fetch the current user's business profile
 * POST /api/profile — Create or update the current user's business profile
 */

export async function GET(_req: NextRequest) {
  // TODO: Authenticate the user via Supabase session
  // const supabase = createServerClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();

  return NextResponse.json({
    message: 'Profile endpoint stub',
    profile: null,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: Validate body with Zod schema
  // TODO: Upsert profile in Supabase
  // TODO: Trigger roadmap generation via Claude

  return NextResponse.json({
    message: 'Profile saved (stub)',
    received: body,
  });
}
