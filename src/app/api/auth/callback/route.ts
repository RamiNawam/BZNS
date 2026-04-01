// ============================================================
// AUTH CALLBACK — exchanges Supabase magic link code for a session
//
// Flow:
//   1. User clicks magic link in email
//   2. Supabase redirects to: /api/auth/callback?code=xxx
//   3. This route exchanges the code for a real session cookie
//   4. Redirects to /dashboard (middleware will redirect to /intake if needed)
// ============================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    // No code = someone landed here directly — send to login
    return NextResponse.redirect(new URL('/login', origin))
  }

  const response = NextResponse.redirect(new URL(next, origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Exchange the one-time code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[Auth Callback] Failed to exchange code:', error.message)
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  // Session is now set in the cookie — redirect to app
  return response
}
