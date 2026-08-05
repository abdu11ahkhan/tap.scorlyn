import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";

export const dynamic = "force-dynamic";

const SOURCES = new Set(["nfc", "qr", "link"]);

/**
 * Records that someone opened a card. Called from the profile page on mount.
 * Fire-and-forget from the client's point of view — a failure here must never
 * break the card itself.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username : null;

    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const source = SOURCES.has(body?.source) ? body.source : "link";
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("card_profiles")
      .select("id")
      .eq("username", username)
      .eq("published", true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "card not found" }, { status: 404 });
    }

    const userAgent = request.headers.get("user-agent") ?? "";

    const { error } = await supabase.from("card_taps").insert({
      card_profile_id: profile.id,
      nfc_card_id: typeof body?.nfcCardId === "string" ? body.nfcCardId : null,
      source,
      referrer: request.headers.get("referer"),
      user_agent: userAgent.slice(0, 500),
      visitor_hash: visitorHash(clientIp(request.headers), userAgent),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
