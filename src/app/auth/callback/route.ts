import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Only ever redirect somewhere inside this site. `next` survives the whole
 * round trip through Google, so without this an OAuth link could be crafted to
 * land a freshly-authenticated visitor on someone else's domain.
 */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard/card";
}

/**
 * Completes a Google sign-in.
 *
 * @supabase/ssr uses the PKCE flow, so Google sends the browser back here with
 * a one-time `code` rather than tokens in the URL fragment. Exchanging it on
 * the server is what writes the session cookies — doing it client-side would
 * leave every Server Component still seeing a signed-out visitor on first load.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Google reports a refusal by redirecting here with an error, not by failing
  // the request — without this branch that arrives as a confusing "no code".
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    redirect(`/login?error=${encodeURIComponent("oauth-failed")}`);
  }

  if (!code) {
    redirect("/login?error=oauth-failed");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect("/login?error=oauth-failed");
  }

  redirect(next);
}
