"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

/**
 * Owner self-service for physical cards. Both go through SECURITY DEFINER
 * functions that check the card (and the page) belong to the caller —
 * nfc_cards stays read-only to customers otherwise.
 */
export async function saveMyCard(
  cardId: string,
  input: { profileId: string | null; nickname: string; paused: boolean; pageChanged: boolean }
): Promise<Result> {
  try {
    const supabase = await createClient();
    if (input.pageChanged) {
      const { error } = await supabase.rpc("set_my_card_page", { p_card: cardId, p_profile: input.profileId });
      if (error) throw new Error(error.message);
    }
    const { error } = await supabase.rpc("update_my_card", {
      p_card: cardId,
      p_nickname: input.nickname.slice(0, 80),
      p_paused: input.paused,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/cards");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
