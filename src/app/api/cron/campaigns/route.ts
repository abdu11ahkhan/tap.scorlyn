import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendCampaign, mailerConfigured, type Recipient } from "@/lib/email";

/**
 * Sends any campaign whose scheduled time has passed.
 *
 * Runs on a Vercel cron. A scheduled send has no user session behind it, so
 * this uses the service role rather than the cookie-bound client — and is
 * therefore gated on a shared secret, because an unauthenticated route holding
 * the service role would let anyone drain the mail queue.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!mailerConfigured()) {
    return Response.json({ error: "smtp not configured" }, { status: 503 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: due } = await supabase
    .from("email_campaigns")
    .select("id, subject, body_text, audience")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .limit(5);

  if (!due?.length) return Response.json({ sent: 0, campaigns: 0 });

  let total = 0;

  for (const campaign of due) {
    // Claim it first. Two overlapping cron ticks would otherwise both pick up
    // the same row and mail everyone twice.
    const { data: claimed } = await supabase
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign.id)
      .eq("status", "scheduled")
      .select("id");
    if (!claimed?.length) continue;

    const { data: profiles } = await supabase.from("profiles").select("id, email, referral_code");
    let rows = profiles ?? [];

    if (campaign.audience === "customers_with_cards") {
      const { data: cards } = await supabase.from("card_profiles").select("user_id");
      const withCards = new Set((cards ?? []).map((c) => c.user_id));
      rows = rows.filter((r) => withCards.has(r.id));
    } else if (campaign.audience === "test") {
      rows = rows.slice(0, 1);
    }

    const recipients: Recipient[] = rows
      .filter((r) => Boolean(r.email))
      .map((r) => ({ email: r.email as string, refCode: r.referral_code }));

    const { sent, failed } = await sendCampaign(recipients, campaign.subject, campaign.body_text);
    total += sent;

    await supabase
      .from("email_campaigns")
      .update({
        status: failed.length && !sent ? "failed" : "sent",
        sent_at: new Date().toISOString(),
        recipient_count: sent,
        last_error: failed.length ? failed.map((f) => `${f.email}: ${f.error}`).join("; ") : null,
      })
      .eq("id", campaign.id);
  }

  return Response.json({ sent: total, campaigns: due.length });
}
