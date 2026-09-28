"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

function fail(error: unknown): Result<never> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/** Google link lives on the card (the template reads it); alert settings live in review_settings. */
export async function saveReviewSettings(
  profileId: string,
  input: { googleUrl: string; notifyEmail: string; notifyWhatsapp: string }
): Promise<Result<{ token: string }>> {
  try {
    const { supabase } = await assertAdmin();

    const googleUrl = input.googleUrl.trim();
    if (googleUrl && !/^https:\/\/\S+$/i.test(googleUrl)) throw new Error("The Google link must start with https://");
    const notifyEmail = input.notifyEmail.trim().toLowerCase();
    if (notifyEmail && !EMAIL.test(notifyEmail)) throw new Error("That email address doesn't look right.");
    const notifyWhatsapp = input.notifyWhatsapp.replace(/[^\d+]/g, "").slice(0, 20);

    const { data: card } = await supabase
      .from("card_profiles")
      .select("id, review_config")
      .eq("id", profileId)
      .maybeSingle();
    if (!card) throw new Error("Card not found.");

    const { error: cardError } = await supabase
      .from("card_profiles")
      .update({ review_config: { ...(card.review_config ?? {}), google_url: googleUrl } })
      .eq("id", profileId);
    if (cardError) throw new Error(cardError.message);

    const { data: settings, error } = await supabase
      .from("review_settings")
      .upsert(
        {
          card_profile_id: profileId,
          notify_email: notifyEmail || null,
          notify_whatsapp: notifyWhatsapp || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "card_profile_id" }
      )
      .select("share_token")
      .single();
    if (error || !settings) throw new Error(error?.message ?? "Could not save.");

    revalidatePath("/admin/reviews");
    return { ok: true, data: { token: settings.share_token } };
  } catch (e) {
    return fail(e);
  }
}

/** Issues a new private link; the old one stops working immediately. */
export async function resetFeedbackLink(profileId: string): Promise<Result<{ token: string }>> {
  try {
    const { supabase } = await assertAdmin();
    const token = randomBytes(32).toString("hex");
    const { error } = await supabase
      .from("review_settings")
      .upsert(
        { card_profile_id: profileId, share_token: token, updated_at: new Date().toISOString() },
        { onConflict: "card_profile_id" }
      );
    if (error) throw new Error(error.message);
    revalidatePath("/admin/reviews");
    return { ok: true, data: { token } };
  } catch (e) {
    return fail(e);
  }
}
