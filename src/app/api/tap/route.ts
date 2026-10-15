import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";
import { mailerConfigured, sendFirstTap } from "@/lib/email";
import { LIMITS, checkLimits, limitIdentity, readJsonBody, serviceClient, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SOURCES = new Set(["nfc", "qr", "card", "link"]);

/** Same shape card_profiles enforces (3–30 chars), with room for older handles. */
const USERNAME = /^[a-z0-9][a-z0-9_-]{1,39}$/;
/** Card codes are short URL-safe tokens; this only rejects junk, not old formats. */
const NFC_CODE = /^[A-Za-z0-9_-]{1,64}$/;

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
  // Review Card: the star value rides in `target`.
  "rating",
  "review_click",
  "feedback_open",
  "feedback_submit",
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
    const { body: raw, tooLarge } = await readJsonBody(request, 4096);
    if (tooLarge) return NextResponse.json({ error: "request too large" }, { status: 413 });
    const body = raw as Record<string, unknown> | null;
    const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : null;

    if (!username || !USERNAME.test(username)) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    // Before any database read: broadest key first, so a flood from one
    // address is turned away after a single counter update. No per-card cap
    // (see LIMITS): it would let a few addresses lock out a card's real visitors.
    const who = limitIdentity(request.headers);
    const limit = await checkLimits([
      { key: `tap:ip:${who.ip}`, windowSeconds: 60, max: LIMITS.tap.ipPerMinute },
      { key: `tap:v:${who.visitor}`, windowSeconds: 60, max: LIMITS.tap.visitorPerMinute },
    ]);
    if (!limit.allowed) return tooManyRequests(60);

    const source = typeof body?.source === "string" && SOURCES.has(body.source) ? body.source : "link";
    const eventType = typeof body?.eventType === "string" && EVENT_TYPES.has(body.eventType) ? body.eventType : "view";
    // A free-text sub-classification (e.g. a button's kind), not an id — never
    // trusted for anything beyond display, so no validation needed beyond a
    // sane length.
    const target =
      typeof body?.target === "string" && body.target.trim() ? body.target.trim().slice(0, 40) : null;

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("public_card_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

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
    if (nfcCode && NFC_CODE.test(nfcCode)) {
      const { data: rows } = await supabase.rpc("resolve_nfc_card", { code: nfcCode });
      const nfcCard = rows?.[0];
      if (nfcCard?.card_profile_id === profile.id) {
        nfcCardId = nfcCard.nfc_card_id;
      }
    }

    const userAgent = request.headers.get("user-agent") ?? "";

    // Writes go through the service role: migration 070 removes the
    // anonymous insert policy, so this route (with its limits) is the only
    // way in. Without the key (local dev) the anon client still works for as
    // long as that policy exists.
    const admin = serviceClient();
    const writer = admin ?? supabase;

    // Checked before the insert below creates one: "was that the first tap
    // this card ever recorded". Counted with the service role: card_taps is
    // only readable by the card's owner, so an anonymous count always came
    // back 0 and the "first tap" email went out on every tap.
    let isFirstTap = false;
    if (nfcCardId && admin) {
      const { count, error: countError } = await admin
        .from("card_taps")
        .select("id", { count: "exact", head: true })
        .eq("nfc_card_id", nfcCardId);
      isFirstTap = !countError && count === 0;
    }

    const { error } = await writer.from("card_taps").insert({
      card_profile_id: profile.id,
      nfc_card_id: nfcCardId,
      source,
      event_type: eventType,
      target,
      referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
      user_agent: userAgent.slice(0, 500),
      visitor_hash: visitorHash(clientIp(request.headers), userAgent),
    });

    if (error) {
      // Never echo database detail to an anonymous caller.
      return NextResponse.json({ error: "could not record" }, { status: 500 });
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
  } catch {
    return NextResponse.json({ error: "could not record" }, { status: 500 });
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
