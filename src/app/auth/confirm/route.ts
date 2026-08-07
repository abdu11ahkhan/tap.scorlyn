import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Where each kind of email link lands once the token checks out.
 * Recovery goes to settings because that is where the password panel lives.
 */
const LANDING: Record<string, string> = {
  recovery: "/dashboard/settings",
  email_change: "/dashboard/settings",
  invite: "/dashboard/card",
  signup: "/dashboard/card",
  magiclink: "/dashboard/card",
};

/**
 * Only ever redirect somewhere inside this site. `next` arrives from a query
 * string, so without this an email link could be rewritten to bounce a
 * freshly-authenticated visitor onto someone else's domain. A leading `//`
 * is protocol-relative and counts as off-site.
 */
function safeNext(next: string | null, type: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return LANDING[type] ?? "/dashboard/card";
}

/**
 * Verifies an emailed auth token on *our* domain.
 *
 * The default GoTrue link points at `<project-ref>.supabase.co/auth/v1/verify`
 * with an opaque token and a `redirect_to` pointing somewhere else again. A
 * random hostname plus a token plus an off-site redirect is the exact shape
 * spam filters score as phishing, and it was landing our auth mail in spam.
 * Exchanging the token here means every link in every email reads
 * `tap.scorlyn.com`, matching the site it actually goes to.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    redirect("/login?error=link-invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Expired and already-used links are the common case, not an outage.
    redirect("/login?error=link-expired");
  }

  redirect(safeNext(searchParams.get("next"), type));
}
