import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";
import { mailerConfigured, sendFeedbackAlert } from "@/lib/email";
import { formatSerial } from "@/lib/card-codes";
import { LIMITS, checkLimits, claimCooldown, limitIdentity, readJsonBody, serviceClient, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const USERNAME = /^[a-z0-9][a-z0-9_-]{1,39}$/;

/**
 * Stores what a customer writes on a Review Card.
 *
 * Nothing from the browser is trusted as an id: the business comes from the
 * public username (published cards only) and the physical card from its
 * public code, both resolved inside submit_review_feedback() — the table has
 * no insert policy at all, so this function is the only way in.
 */
export async function POST(request: NextRequest) {
  try {
    const { body: raw, tooLarge } = await readJsonBody(request, 8192);
    if (tooLarge) return NextResponse.json({ error: "request too large" }, { status: 413 });
    const body = raw as Record<string, unknown> | null;

    // Honeypot: a real visitor never sees or fills this field.
    if (text(body?.website, 200)) return NextResponse.json({ ok: true });

    const username = text(body?.username, 40).toLowerCase();
    const rating = Number(body?.rating);
    if (!username || !USERNAME.test(username) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "invalid feedback" }, { status: 400 });
    }

    const category = text(body?.category, 40);
    const message = text(body?.message, 2000);
    if (!category && !message) {
      return NextResponse.json({ error: "empty feedback" }, { status: 400 });
    }

    // Checked only for well-formed submissions, before anything is stored.
    // No per-card cap: a few attacking addresses could otherwise use it to
    // block every genuine review on a card (see LIMITS).
    const who = limitIdentity(request.headers);
    const limit = await checkLimits([
      { key: `fb:ip:${who.ip}`, windowSeconds: 3600, max: LIMITS.feedback.ipPerHour },
      { key: `fb:v:${who.visitor}`, windowSeconds: 3600, max: LIMITS.feedback.visitorPerHour },
    ]);
    if (!limit.allowed) return tooManyRequests(600);

    const email = text(body?.email, 200);
    const source =
      typeof body?.source === "string" && ["nfc", "qr", "card", "link"].includes(body.source) ? body.source : "link";
    const userAgent = request.headers.get("user-agent") ?? "";

    // The service role, when configured: migration 070 revokes the anonymous
    // EXECUTE on submit_review_feedback(), so the limits above can't be
    // skipped by calling the function directly. The function still does all
    // of its own checks (published card, card code belongs to it).
    const supabase = serviceClient() ?? (await createClient());
    const { error } = await supabase.rpc("submit_review_feedback", {
      p_username: username,
      p_code: text(body?.nfcCode, 32) || null,
      p_rating: rating,
      p_category: category || null,
      p_message: message || null,
      p_name: text(body?.name, 100) || null,
      p_phone: text(body?.phone, 40) || null,
      p_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
      p_source: source,
      p_visitor_hash: visitorHash(clientIp(request.headers), userAgent),
    });

    if (error) {
      const notFound = /card not found/i.test(error.message);
      return NextResponse.json({ error: notFound ? "card not found" : "could not save" }, { status: notFound ? 404 : 500 });
    }

    // After the save, and swallowed on failure: a mail problem must never
    // make the customer think their feedback didn't go through. Throttled to
    // one email per card per few minutes inside notifyBusiness. Feedback that
    // arrives during the cooldown is still saved (above) and shows in the
    // dashboard and on the private feedback link; it doesn't get an email of
    // its own. The next email that does go out includes how many pieces of
    // feedback the card received in the last hour.
    await notifyBusiness({
      username,
      nfcCode: text(body?.nfcCode, 32),
      rating,
      category,
      message,
      name: text(body?.name, 100),
      phone: text(body?.phone, 40),
      email,
      origin: request.nextUrl.origin,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "could not save" }, { status: 500 });
  }
}

async function notifyBusiness(f: {
  username: string;
  nfcCode: string;
  rating: number;
  category: string;
  message: string;
  name: string;
  phone: string;
  email: string;
  origin: string;
}) {
  try {
    if (!mailerConfigured()) return;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return;

    // Service role: an anonymous visitor can't (and mustn't) read where a
    // business wants its alerts sent.
    //
    // Deliberately its own client rather than the shared serviceClient() this
    // route already uses above: serviceClient()'s declared return type
    // (ReturnType<typeof createClient> in src/lib/rate-limit.ts) doesn't carry
    // a concrete Database generic, so every other caller only ever reads
    // `error` off it or passes it straight to .insert()/.rpc(). The moment
    // this function's .select(...).maybeSingle() results are destructured
    // (profile.id, settings.notify_email, etc.), tsc infers those rows as
    // `never` and the build fails. Fixing that means changing
    // serviceClient()'s type for every one of its callers, which is a bigger,
    // separate change — tracked here rather than done as a drive-by fix.
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: profile } = await admin
      .from("card_profiles")
      .select("id, full_name")
      .eq("username", f.username)
      .maybeSingle();
    if (!profile) return;

    const { data: settings } = await admin
      .from("review_settings")
      .select("notify_email, share_token")
      .eq("card_profile_id", profile.id)
      .maybeSingle();
    if (!settings?.notify_email) return;

    // Server-side cooldown, claimed only when an email is really about to go
    // out, so a card with alerts off never starts one.
    const mayEmail = await claimCooldown(
      `feedback-email:${profile.id}`,
      LIMITS.feedback.emailCooldownSeconds
    );
    if (!mayEmail) return;

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: lastHour } = await admin
      .from("review_feedback")
      .select("id", { count: "exact", head: true })
      .eq("card_profile_id", profile.id)
      .gte("created_at", since);

    let where = "";
    if (f.nfcCode) {
      const { data: card } = await admin
        .from("nfc_cards")
        .select("serial, nickname, location, card_profile_id")
        .eq("card_url", f.nfcCode)
        .maybeSingle();
      if (card && card.card_profile_id === profile.id) {
        where = [formatSerial(card.serial), card.nickname, card.location].filter(Boolean).join(" · ");
      }
    }

    const stars = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
    const lines = [
      `${stars}  (${f.rating} of 5)`,
      f.category ? `Topic: ${f.category}` : "",
      f.message ? `“${f.message}”` : "",
      where ? `Card: ${where}` : "",
      f.name || f.phone || f.email
        ? `Customer: ${[f.name, f.phone, f.email].filter(Boolean).join(" · ")}`
        : "They didn't leave contact details.",
      (lastHour ?? 0) > 1
        ? `This card has had ${lastHour} pieces of feedback in the last hour — see them all at the link below.`
        : "",
    ].filter(Boolean);

    await sendFeedbackAlert(
      settings.notify_email,
      `New ${f.rating}-star feedback — ${profile.full_name}`,
      `New feedback for ${profile.full_name} from your review card.\n\n${lines.join("\n\n")}`,
      `${f.origin}/feedback/${settings.share_token}`
    );
  } catch {
    // The feedback itself is already saved.
  }
}
