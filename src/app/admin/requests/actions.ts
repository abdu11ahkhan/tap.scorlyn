"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/admin-auth";
import { formatSerial } from "@/lib/card-codes";
import { mailerConfigured, sendNotice } from "@/lib/email";

type Result = { ok: boolean; error?: string };

/** Approve or reject a customer's request to activate a card, then tell them. */
export async function decideClaim(claimId: string, approve: boolean, note: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.rpc("decide_card_claim", {
      p_claim: claimId,
      p_approve: approve,
      p_note: note.slice(0, 300),
    });
    if (error) throw new Error(error.message);

    await tellCustomer(claimId, approve, note);
    revalidatePath("/admin/requests");
    revalidatePath("/admin/nfc");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Best effort: the decision is already saved and visible to them on the activate page. */
async function tellCustomer(claimId: string, approve: boolean, note: string) {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key || !mailerConfigured()) return;
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
    const { data: claim } = await admin
      .from("card_claims")
      .select("user_id, nfc_cards(serial, card_url)")
      .eq("id", claimId)
      .maybeSingle();
    const card = claim?.nfc_cards as unknown as { serial: number; card_url: string } | null;
    if (!claim || !card) return;
    const { data: person } = await admin.from("profiles").select("email, full_name").eq("id", claim.user_id).maybeSingle();
    if (!person?.email) return;

    const host = (await headers()).get("host") ?? "tap.scorlyn.com";
    const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
    const serial = formatSerial(card.serial);
    const hello = person.full_name ? `Hi ${person.full_name.split(" ")[0]},` : "Hi,";

    if (approve) {
      await sendNotice(
        person.email,
        `Your Scorlyn card ${serial} is ready`,
        `${hello}\n\nYour card ${serial} has been activated. Choose what it opens — your WhatsApp, Instagram, a digital profile or a review card — and it goes live straight away.${note.trim() ? `\n\nNote from ScorlynTap: ${note.trim()}` : ""}`,
        `${origin}/activate/${card.card_url}`
      );
    } else {
      await sendNotice(
        person.email,
        `About your Scorlyn card ${serial}`,
        `${hello}\n\nWe couldn't activate card ${serial} on your account.${note.trim() ? `\n\nReason: ${note.trim()}` : ""}\n\nIf this card is yours, reply to this email or use the activation code printed on the packaging.`
      );
    }
  } catch {
    // Decision stands either way.
  }
}
