"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mailerConfigured, sendCampaign, type Recipient } from "@/lib/email";

/**
 * Server Actions are reachable by direct POST, so a page-level admin check is
 * not a boundary. RLS on email_campaigns is the real backstop; this fails
 * loudly instead of letting a policy silently swallow the write.
 */
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error("Admins only.");

  return { supabase, user };
}

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

function fail(error: unknown): Result<never> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

export type Audience = "all" | "customers_with_cards" | "test" | "custom";

/**
 * Splits a typed recipient box into addresses.
 *
 * Comma, semicolon, space or newline — whatever the admin actually types when
 * pasting a couple of addresses out of a chat.
 */
// Not exported: every export from a "use server" module has to be an async
// Server Action, and this is a plain local helper.
function parseRecipients(raw: string): string[] {
  return [...new Set(
    raw.split(/[,;\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
  )];
}

const EMAIL_RE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/** Resolves an audience to addresses, each with its own referral code. */
async function audienceRecipients(
  audience: Audience,
  adminEmail: string,
  custom = ""
): Promise<Recipient[]> {
  const supabase = await createClient();

  if (audience === "custom") {
    const addresses = parseRecipients(custom);
    if (!addresses.length) throw new Error("Type at least one email address.");
    const bad = addresses.filter((a) => !EMAIL_RE.test(a));
    if (bad.length) throw new Error(`Not a valid address: ${bad.join(", ")}`);

    // If the address belongs to a customer, use their referral code so
    // {{link}} still credits them. Strangers just get the plain site link.
    const { data } = await supabase.from("profiles").select("email, referral_code");
    const known = new Map(
      (data ?? [])
        .filter((r) => r.email)
        .map((r) => [(r.email as string).toLowerCase(), r.referral_code])
    );
    return addresses.map((email) => ({ email, refCode: known.get(email) ?? null }));
  }

  // profiles.email is the account address. card_profiles.email is the public
  // contact button and is often blank or somebody else's inbox.
  if (audience === "test") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user?.id ?? "")
      .maybeSingle();
    return [{ email: adminEmail, refCode: data?.referral_code ?? null }];
  }

  const { data, error } = await supabase.from("profiles").select("id, email, referral_code");
  if (error) throw new Error(error.message);

  let rows = data ?? [];

  if (audience === "customers_with_cards") {
    const { data: cards } = await supabase.from("card_profiles").select("user_id");
    const withCards = new Set((cards ?? []).map((c) => c.user_id));
    rows = rows.filter((r) => withCards.has(r.id));
  }

  return rows
    .filter((r) => Boolean(r.email))
    .map((r) => ({ email: r.email as string, refCode: r.referral_code }));
}

export async function sendNow(
  subject: string,
  body: string,
  audience: Audience,
  custom = ""
): Promise<Result<{ sent: number; failed: number }>> {
  try {
    const { supabase, user } = await assertAdmin();

    if (!subject.trim()) throw new Error("Give the email a subject.");
    if (!body.trim()) throw new Error("The email has no body.");
    if (!mailerConfigured()) {
      throw new Error(
        "Email is not configured on the server. Set SMTP_USER and SMTP_PASS."
      );
    }

    const recipients = await audienceRecipients(audience, user.email ?? "", custom);
    if (recipients.length === 0) throw new Error("That audience has nobody in it.");

    const { data: row, error } = await supabase
      .from("email_campaigns")
      .insert({
        subject,
        body_text: body,
        audience,
        status: "sending",
        custom_recipients: audience === "custom" ? custom : null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { sent, failed } = await sendCampaign(recipients, subject, body);

    await supabase
      .from("email_campaigns")
      .update({
        status: failed.length && !sent ? "failed" : "sent",
        sent_at: new Date().toISOString(),
        recipient_count: sent,
        last_error: failed.length ? failed.map((f) => `${f.email}: ${f.error}`).join("; ") : null,
      })
      .eq("id", row.id);

    revalidatePath("/admin/email");
    return { ok: true, data: { sent, failed: failed.length } };
  } catch (e) {
    return fail(e);
  }
}

export async function schedule(
  subject: string,
  body: string,
  audience: Audience,
  scheduledFor: string,
  custom = ""
): Promise<Result> {
  try {
    const { supabase, user } = await assertAdmin();

    if (!subject.trim()) throw new Error("Give the email a subject.");
    if (!body.trim()) throw new Error("The email has no body.");

    const when = new Date(scheduledFor);
    if (Number.isNaN(when.getTime())) throw new Error("That isn't a valid date and time.");
    if (when.getTime() < Date.now()) throw new Error("That time is in the past.");

    // Validate the box now rather than letting the cron discover it's junk.
    if (audience === "custom") await audienceRecipients(audience, "", custom);

    const { error } = await supabase.from("email_campaigns").insert({
      subject,
      body_text: body,
      audience,
      custom_recipients: audience === "custom" ? custom : null,
      status: "scheduled",
      scheduled_for: when.toISOString(),
      created_by: user.id,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/admin/email");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelScheduled(id: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", id)
      .eq("status", "scheduled");
    if (error) throw new Error(error.message);
    revalidatePath("/admin/email");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
