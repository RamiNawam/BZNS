// ============================================================
// APP LAYOUT — wraps all authenticated app screens
// Server component: checks intake completion on every render.
//
// Two rendering modes:
//   1. /intake path → render children full-screen (no sidebar chrome)
//      because the user hasn't completed intake yet.
//   2. All other paths → render with Sidebar + TopBar (normal app shell).
//
// The x-pathname header is injected by middleware so we can
// know the current path here without any client-side tricks.
// ============================================================

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { ProfileRepository } from '@/repositories/profile.repository'
import Sidebar from '@/components/layout/sidebar'
import TopBar from '@/components/layout/top-bar'
import FloatingAssistant from '@/components/assistant/floating-assistant'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const pathname = headers().get('x-pathname') ?? ''
  const isIntakePath = pathname === '/intake'

  // When Supabase is not yet configured (local dev without .env.local),
  // skip all auth/profile checks and render the app shell directly.
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseConfigured) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Middleware already blocks unauthenticated users, but double-check here
    if (!user) redirect('/login')

    // Check if this user has completed intake
    const profile = await ProfileRepository.getByUserId(user.id)
    const intakeIncomplete = !profile || !profile.intake_completed

    if (intakeIncomplete && !isIntakePath) {
      redirect('/intake')
    }

    if (intakeIncomplete && isIntakePath) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-700">Welcome to BZNS</h1>
              <p className="text-slate-500 mt-2">
                Let&apos;s learn about your business idea so we can build your personalised roadmap.
              </p>
            </div>
            {children}
          </div>
        </div>
      )
    }
  }

  // Intake complete (or dev mode) → render the full app shell
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <FloatingAssistant />
    </div>
  )
}
