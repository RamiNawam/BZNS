// ============================================================
// ROOT MIDDLEWARE — runs on every request
// Responsibilities:
//   1. Refresh the Supabase session cookie
//   2. Redirect unauthenticated users to /login
//   3. Redirect logged-in users away from /login → /dashboard
// ============================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/api/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Forward pathname as a header so server-component layouts can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  // If Supabase env vars are not configured yet (local dev without .env.local),
  // skip auth middleware entirely so the app is still browsable.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response
  }

  // Build a Supabase client that can read/write cookies in middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options } as never)
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options } as never)
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let user = null
  try {
    // Always refresh the session — keeps the cookie alive
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // If the auth cookie is malformed/corrupted, clear it and continue as logged-out.
    // This prevents requests from hanging when Supabase cannot parse session cookies.
    const authCookieNames = request.cookies
      .getAll()
      .map((c) => c.name)
      .filter((name) => name.includes('-auth-token'))

    for (const name of authCookieNames) {
      request.cookies.set({ name, value: '' } as never)
      response.cookies.set({ name, value: '', maxAge: 0, path: '/' })
    }

    console.warn('[middleware] Supabase auth recovery failed; cleared auth cookies.', error)
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/api/auth'))

  // Not logged in + trying to access a protected route → go to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in + on login page → go to dashboard
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
