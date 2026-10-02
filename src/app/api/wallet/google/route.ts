import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleWalletSaveUrl } from "@/lib/google-wallet";

export const dynamic = "force-dynamic";

/**
 * Sends the signed-in owner to Google's "Save to Google Wallet" page for
 * their own card. A redirect rather than a link baked into the dashboard so
 * the token is minted fresh (iat) and the private key never leaves the server.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=/dashboard/settings`);

  const { data: card } = await supabase
    .from("card_profiles")
    .select("username, full_name, headline, company, avatar_url, accent_color")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!card?.username) return NextResponse.redirect(`${origin}/dashboard`);

  const url = googleWalletSaveUrl(card, origin);
  if (!url) return NextResponse.json({ error: "Google Wallet isn't set up yet" }, { status: 503 });
  return NextResponse.redirect(url);
}
