import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";
import { mailerConfigured, sendFirstTap } from "@/lib/email";

export const dynamic = "force-dynamic";

const SOURCES = new Set(["nfc", "qr", "link"]);

/** Kept in one place so card_taps' CHECK constraint and this route can never drift apart. */
const EVENT_TYPES = new Set([
  "view",
  "contact_save",
  "share",
  "qr_open",
  "phone_click",
  "email_click",
  "whatsapp_click",
  "website_click",
  "social_click",
  "booking_click",
]);

/**
 * Records an interaction with a card — a page view, or (Phase 7) a specific
 * action on it: a save, a share, a QR open, an outbound link tap. Called from
 * TapTracker/OutboundClickTracker/ShareButton/CardQr on the
 * moment it happens. Fire-and-forget from every caller's point of view — a
 * failure here must never break the card itself, and callers never await
 * this before letting their own action (a tel:/mailto: navigation, a native
 * share, a vCard download) proceed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username : null;

    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const source = SOURCES.has(body?.source) ? body.source : "link";
    const eventType = EVENT_TYPES.has(body?.eventType) ? body.eventType : "view";
    // A free-text sub-classification (e.g. a button's kind), not an id — never
    // trusted for anything beyond display, so no validation needed beyond a
    // sane length.
    const target =
      typeof body?.target === "string" && body.target.trim() ? body.target.trim().slice(0, 40) : null;

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

    // The client can only ever hand us the public card_url printed on the
    // tag itself (see /api/nfc/[cardId]) — never the nfc_cards.id we actually
    // store. Resolving it here, and requiring it to belong to *this*
    // profile, means a client can't fabricate attribution to a card it was
    // never handed, or to someone else's profile. Same RPC the redirect
    // uses: nfc_cards has no public SELECT policy, so a direct table query
    // would silently return nothing for this anonymous request.
    let nfcCardId: string | null = null;
    const nfcCode = typeof body?.nfcCode === "string" ? body.nfcCode.trim() : "";
    if (nfcCode) {
      const { data: rows } = await supabase.rpc("resolve_nfc_card", { code: nfcCode });
      const nfcCard = rows?.[0];
      if (nfcCard?.card_profile_id === profile.id) {
        nfcCardId = nfcCard.nfc_card_id;
      }
    }

    const userAgent = request.headers.get("user-agent") ?? "";

    // Checked before the insert below creates one: this is the only way to
    // know "was that the first tap this card ever recorded" after the row
    // exists — derived from the same card_taps.nfc_card_id attribution
    // Phase 7/11 already rely on, not a new signal.
    let isFirstTap = false;
    if (nfcCardId) {
      const { count } = await supabase
        .from("card_taps")
        .select("id", { count: "exact", head: true })
        .eq("nfc_card_id", nfcCardId);
      isFirstTap = (count ?? 0) === 0;
    }

    const { error } = await supabase.from("card_taps").insert({
      card_profile_id: profile.id,
      nfc_card_id: nfcCardId,
      source,
      event_type: eventType,
      target,
      referrer: request.headers.get("referer"),
      user_agent: userAgent.slice(0, 500),
      visitor_hash: visitorHash(clientIp(request.headers), userAgent),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Deliberately after the insert succeeds, and deliberately swallowed on
    // failure inside notifyFirstTap — a mail failure must never make the tap
    // itself look like it didn't happen, and this anonymous request has no
    // session, so reading the card owner's email needs the service role, the
    // same as any other system-triggered (not customer-triggered) cross-user
    // read in this codebase.
    if (isFirstTap) {
      await notifyFirstTap(profile.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function notifyFirstTap(cardProfileId: string) {
  try {
    if (!mailerConfigured()) return;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return;

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: card } = await admin
      .from("card_profiles")
      .select("user_id, full_name")
      .eq("id", cardProfileId)
      .maybeSingle();
    if (!card?.user_id) return;

    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", card.user_id)
      .maybeSingle();
    if (!profile?.email) return;

    await sendFirstTap({ to: profile.email, name: card.full_name || profile.full_name });
  } catch {
    // Deliberately swallowed — see the call site above.
  }
}
