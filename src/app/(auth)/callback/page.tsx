// This page is no longer the primary callback handler.
// The real code exchange happens in: src/app/api/auth/callback/route.ts
// Supabase magic links now point to: /api/auth/callback
// This page exists as a fallback in case someone lands on /auth/callback directly.

import { redirect } from 'next/navigation';

export default function AuthCallbackPage() {
  redirect('/dashboard');
}
