import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";
import { LIMITS, checkLimits, limitIdentity, readJsonBody, serviceClient, tooManyRequests, type Rule } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EVENTS = new Set(["banner_view", "banner_click", "signup", "order"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REF_CODE = /^[A-Za-z0-9_-]{1,40}$/;

/** How recently an account must have been created to be credited as a signup. */
const SIGNUP_FRESH_MS = 24 * 60 * 60 * 1000;

/**
 * Records a step of the viral funnel against the referrer who owns the card
 * the visitor tapped. `refCode` is the referrer's profiles.referral_code.
 *
 * Anonymous by design (a signup is attributed before the email is confirmed,
 * so there may be no session yet), which is why every client-supplied field
 * is format-checked here and a "signup" is only credited to an account that
 * really exists and was created within the last day — an old account, or an
 * id someone made up, can't be claimed as a referral.
 */
export async function POST(request: NextRequest) {
  try {
    const { body: raw, tooLarge } = await readJsonBody(request, 2048);
    if (tooLarge) return NextResponse.json({ error: "request too large" }, { status: 413 });
    const body = raw as Record<string, unknown> | null;

    const refCode = typeof body?.refCode === "string" ? body.refCode.trim() : null;
    const eventType = typeof body?.eventType === "string" ? body.eventType : null;

    if (!refCode || !REF_CODE.test(refCode) || !eventType || !EVENTS.has(eventType)) {
      return NextResponse.json({ error: "refCode and valid eventType required" }, { status: 400 });
    }

    const who = limitIdentity(request.headers);
    const rules: Rule[] = [
      { key: `ref:ip:${who.ip}`, windowSeconds: 3600, max: LIMITS.referral.ipPerHour },
      { key: `ref:v:${who.visitor}`, windowSeconds: 3600, max: LIMITS.referral.visitorPerHour },
    ];
    // "order" is claimed by the browser and can't be verified, so it gets a
    // tight daily cap. "signup" doesn't: it is credited only for a real
    // account created in the last day, once per account (unique index), and
    // capping it per network would drop genuine signups from shared IPs.
    if (eventType === "order") {
      rules.push(
        { key: `ref:order:ip:${who.ip}`, windowSeconds: 86400, max: LIMITS.referral.ordersPerIpPerDay },
        { key: `ref:order:v:${who.visitor}`, windowSeconds: 86400, max: LIMITS.referral.ordersPerVisitorPerDay }
      );
    }
    const limit = await checkLimits(rules);
    if (!limit.allowed) return tooManyRequests(600);

    const supabase = await createClient();

    // Resolved through card_profiles, not profiles: `profiles` is only readable
    // by its own owner, and the visitor firing this event is anonymous.
    const { data: referrerId } = await supabase.rpc("referrer_for_code", { p_code: refCode });
    const referrer = referrerId ? { user_id: referrerId as string } : null;

    if (!referrer) {
      // Unknown code — silently accept so we don't leak which codes are real.
      return NextResponse.json({ ok: true });
    }

    const cardProfileId =
      typeof body?.cardProfileId === "string" && UUID.test(body.cardProfileId) ? body.cardProfileId : null;
    const referredUserId =
      typeof body?.referredUserId === "string" && UUID.test(body.referredUserId) ? body.referredUserId : null;

    if (eventType === "signup") {
      // Same quiet acceptance as an unknown code: nothing is recorded, and
      // nothing tells the caller why.
      if (!referredUserId || referredUserId === referrer.user_id) return NextResponse.json({ ok: true });
      if (!(await isFreshAccount(referredUserId))) return NextResponse.json({ ok: true });
    }

    const userAgent = request.headers.get("user-agent") ?? "";

    // Service role when configured: migration 070 drops the "anyone can
    // insert" policy, so these checks can't be skipped by writing to the
    // table directly. The anon client still works locally until then.
    const writer = serviceClient() ?? supabase;
    const { error } = await writer.from("referral_events").insert({
      referrer_user_id: referrer.user_id,
      ref_code: refCode,
      card_profile_id: cardProfileId,
      event_type: eventType,
      referred_user_id: eventType === "signup" ? referredUserId : null,
      visitor_hash: visitorHash(clientIp(request.headers), userAgent),
    });

    if (error) {
      // The partial unique index on signup events makes repeat signups a
      // no-op rather than an error worth surfacing.
      if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
      // Never echo database detail to an anonymous caller.
      return NextResponse.json({ error: "could not record" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "could not record" }, { status: 500 });
  }
}

/**
 * Whether `userId` is a real account created within SIGNUP_FRESH_MS. Needs
 * the service role (profiles is owner-only). Without the key — local dev —
 * it can't check, so it allows the event rather than silently breaking
 * attribution there.
 */
async function isFreshAccount(userId: string): Promise<boolean> {
  const admin = serviceClient();
  if (!admin) return true;
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const created = data?.user?.created_at ? Date.parse(data.user.created_at) : NaN;
    return Number.isFinite(created) && Date.now() - created <= SIGNUP_FRESH_MS;
  } catch {
    return false;
  }
}
