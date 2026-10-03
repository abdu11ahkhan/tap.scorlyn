import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleWalletProblem, googleWalletSaveUrl } from "@/lib/google-wallet";

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
  if (!user) return NextResponse.redirect(`${origin}/login?next=/dashboard/my-card`);

  // ?id= picks one of their cards; RLS plus the user_id filter keep it to
  // their own. Without it, their first card.
  const id = new URL(request.url).searchParams.get("id");
  let query = supabase
    .from("card_profiles")
    .select("username, full_name, headline, company, avatar_url, accent_color")
    .eq("user_id", user.id);
  query = id ? query.eq("id", id) : query.order("created_at", { ascending: true }).limit(1);
  const { data: card } = await query.maybeSingle();
  if (!card?.username) return NextResponse.redirect(`${origin}/dashboard`);

  const problem = googleWalletProblem();
  if (problem) return NextResponse.json({ error: `Google Wallet isn't set up: ${problem}` }, { status: 503 });

  let url: string | null;
  try {
    url = await googleWalletSaveUrl(card, origin);
  } catch (err) {
    console.error("google wallet signing failed", err);
    return NextResponse.json(
      { error: "Google Wallet isn't set up: GOOGLE_WALLET_PRIVATE_KEY couldn't be read" },
      { status: 503 }
    );
  }
  if (!url) return NextResponse.json({ error: "Google Wallet isn't set up yet" }, { status: 503 });
  return NextResponse.redirect(url);
}
