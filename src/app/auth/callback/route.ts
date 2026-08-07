import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mailerConfigured, sendWelcome } from "@/lib/email";

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

  await welcomeOnce(supabase);

  redirect(next);
}

/**
 * Sends the welcome email the first time an account signs in.
 *
 * Google sign-in has no confirmation step — the address is verified by Google
 * before it reaches us — so nothing else would ever tell the person an account
 * exists in their name. Guarded on profiles.welcomed_at so it goes once, not
 * on every sign-in.
 *
 * Never allowed to fail the sign-in: being unable to send a courtesy email is
 * not a reason to keep someone out of their dashboard.
 */
async function welcomeOnce(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    if (!mailerConfigured()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("welcomed_at, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.welcomed_at) return;

    // Claim it first, so two tabs finishing at once cannot send twice.
    const { data: claimed } = await supabase
      .from("profiles")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("welcomed_at", null)
      .select("id");

    if (!claimed?.length) return;

    await sendWelcome(user.email, profile.full_name);
  } catch {
    // Swallowed on purpose — see above.
  }
}
