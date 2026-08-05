import { createBrowserClient } from '@supabase/ssr'

function build(url: string, key: string) {
  return createBrowserClient(url, key)
}

// Inferred from a concrete call, not `ReturnType<typeof createBrowserClient>`.
// The generic form resolves the type parameters to their constraints, which
// makes `.from(...).select()` return `any` and silently drops typing at every
// call site.
let cached: ReturnType<typeof build> | null = null

/**
 * Shared browser client, created once.
 *
 * Callers invoke this in component bodies, which means it also runs during
 * prerendering. @supabase/ssr throws when the URL and key are absent, so a
 * production build failed outright if the env vars weren't configured — even
 * on a page like /dashboard/billing that never touches Supabase. Falling back
 * to an unroutable placeholder on the server lets the build finish; in the
 * browser a missing key still throws loudly rather than failing silently.
 *
 * Memoised because the previous version returned a new client on every render,
 * and each one starts its own auth listener.
 */
export function createClient() {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window === 'undefined') {
      // Build-time only. `.invalid` is reserved by RFC 2606 and never resolves,
      // so this can't quietly point at somebody's real project.
      return build('https://unconfigured.invalid', 'unconfigured')
    }
    throw new Error(
      'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  cached = build(url, key)
  return cached
}
