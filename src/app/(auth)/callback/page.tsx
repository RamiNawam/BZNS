import { redirect } from 'next/navigation';

/**
 * Auth callback page — handles the redirect from Supabase magic link / OAuth.
 * The middleware or a server action should exchange the code for a session.
 */
export default function AuthCallbackPage() {
  // TODO: Exchange the auth code for a Supabase session server-side
  // This is handled by the middleware (src/lib/supabase/middleware.ts)
  // which intercepts the ?code= query param and sets the session cookie.
  redirect('/dashboard');
}
