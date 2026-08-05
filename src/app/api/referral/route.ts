import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";

export const dynamic = "force-dynamic";

const EVENTS = new Set(["banner_view", "banner_click", "signup", "order"]);

/**
 * Records a step of the viral funnel against the referrer who owns the card
 * the visitor tapped. `refCode` is the referrer's profiles.referral_code.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const refCode = typeof body?.refCode === "string" ? body.refCode : null;
    const eventType = typeof body?.eventType === "string" ? body.eventType : null;

    if (!refCode || !eventType || !EVENTS.has(eventType)) {
      return NextResponse.json({ error: "refCode and valid eventType required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Resolved through card_profiles, not profiles: `profiles` is only readable
    // by its own owner, and the visitor firing this event is anonymous.
    const { data: referrer } = await supabase
      .from("card_profiles")
      .select("user_id")
      .eq("referral_code", refCode)
      .eq("published", true)
      .limit(1)
      .maybeSingle();

    if (!referrer) {
      // Unknown code — silently accept so we don't leak which codes are real.
      return NextResponse.json({ ok: true });
    }

    const userAgent = request.headers.get("user-agent") ?? "";

    const { error } = await supabase.from("referral_events").insert({
      referrer_user_id: referrer.user_id,
      ref_code: refCode,
      card_profile_id: typeof body?.cardProfileId === "string" ? body.cardProfileId : null,
      event_type: eventType,
      referred_user_id: typeof body?.referredUserId === "string" ? body.referredUserId : null,
      visitor_hash: visitorHash(clientIp(request.headers), userAgent),
    });

    if (error) {
      // The partial unique index on signup events makes repeat signups a
      // no-op rather than an error worth surfacing.
      if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
