import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/cache — Invalidate server-side caches (knowledge base cache,
 * Claude prompt cache, etc.). Used during development and after data updates.
 */

export async function DELETE(_req: NextRequest) {
  // TODO: Clear in-memory knowledge base cache
  // TODO: Optionally purge Supabase cached rows

  return NextResponse.json({
    message: 'Cache cleared (stub)',
    cleared: ['knowledge-base', 'funding-scores'],
  });
}

export async function GET(_req: NextRequest) {
  // TODO: Return cache status / hit rates

  return NextResponse.json({
    status: 'ok',
    cache: {
      knowledgeBase: { entries: 0, hitRate: '—' },
      fundingScores: { entries: 0, hitRate: '—' },
    },
  });
}
